import { useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Input,
} from '@material-tailwind/react';
import CustomSwal from '@/utils/customSwal';
import { monitoringAttemps } from '@/services/salesforce/monitoring';
import AgentCell from '../../components/agent/AgentCell';
import MonitoringFilters from '../../components/monitoring/MonitoringFilters';
import MultiSelectFilter from '../../components/monitoring/MultiSelectFilter';
import BulkActionsBar from '../../components/monitoring/BulkActionsBar';
import AssignAgentModal from '../../components/agent/AssignAgentModal';
import { getAllUsers } from '../../services/users/getUsers';
import { casesAssignmentsAll } from '@/services/caseAssignments/allCasesAssignments';
import { monitoringReport } from '../../utils/excelsExport/monitoringExcel';
import { assignmentsReport } from '../../utils/excelsExport/assignmentsExcel';
import { getAllCallCenters } from '@/services/callCenter/getCallCenter';
import {
  ArrowPathIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/solid';
import { useAuth } from '@/context/loginContext';
import ScaleWrapper from '@/components/ScaleWrapper';

const getAttemptClass = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '';
  if (num >= 0 && num <= 2) {
    return 'bg-red-100 text-red-700';
  }
  if (num >= 3 && num <= 5) {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (num >= 6) {
    return 'bg-green-100 text-green-700';
  }
  return '';
};
const getAttemptColor = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  if (num >= 0 && num <= 2) return 'red';
  if (num >= 3 && num <= 5) return 'yellow';
  if (num >= 6) return 'green';
  return null;
};
const getAttemptValue = (row, source) => {
  return Number(row?.[source] ?? null);
};

const getPeruDateString = () => {
  const now = new Date();
  const lima = new Date(
    now.toLocaleString('en-US', { timeZone: 'America/Lima' })
  );
  const yyyy = lima.getFullYear();
  const mm = String(lima.getMonth() + 1).padStart(2, '0');
  const dd = String(lima.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export function Monitoring() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [filteredCases, setFilteredCases] = useState([]);

  const [filterSubstatus, setFilterSubstatus] = useState([]);
  const [filterOrigin, setFilterOrigin] = useState([]);
  const [filterType, setFilterType] = useState([]);
  const [filterSupplierSegment, setFilterSupplierSegment] = useState([]);
  const [filterAgentId, setFilterAgentId] = useState([]);
  const [filterAgentGroup, setFilterAgentGroup] = useState([]);

  const [agents, setAgents] = useState([]);
  const [assigners, setAssigners] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [filterOwnerName, setFilterOwnerName] = useState('');
  const [filterAssignerId, setFilterAssignerId] = useState([]);

  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });

  const [agentGroups, setAgentGroups] = useState([]);
  const [callCenters, setCallCenters] = useState([]);
  const [attemptColorFilter, setAttemptColorFilter] = useState([]);
  const [attemptSource, setAttemptSource] = useState('attempts1');

  const [selectedCaseNumbers, setSelectedCaseNumbers] = useState([]);
  const [openBulkAssign, setOpenBulkAssign] = useState(false);

  // Estados para el modal de búsqueda de asignaciones
  const [openSearchAssignments, setOpenSearchAssignments] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    startDate: getPeruDateString(),
    endDate: '',
    assignedAgentId: [],
    agentGroup: [],
    assignedById: [],
  });

  const fetchMonitoring = async (isAuto = false) => {
    if (!isAuto) {
      setLoading(true);
    }
    setSelectedCaseNumbers([]);
    setLastSelectedIndex(null);
    setOpenBulkAssign(false);
    try {
      const { data } = await monitoringAttemps();
      setCases(Array.isArray(data) ? data : []);
      setSelectedCaseNumbers([]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching monitoring:', error);
      CustomSwal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.message || 'Error loading monitoring data',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCaseSelection = (caseNumber, index, event) => {
    setSelectedCaseNumbers((prev) => {
      if (event?.shiftKey && lastSelectedIndex !== null) {
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);

        const rangeCases = sortedCases
          .slice(start, end + 1)
          .map((c) => c.caseNumber);

        return Array.from(new Set([...prev, ...rangeCases]));
      }

      if (event?.ctrlKey || event?.metaKey) {
        if (prev.includes(caseNumber)) {
          return prev.filter((id) => id !== caseNumber);
        }
        return [...prev, caseNumber];
      }

      setLastSelectedIndex(index);
      return [caseNumber];
    });

    if (!event?.ctrlKey && !event?.metaKey) {
      setLastSelectedIndex(index);
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }
      return { key, direction: 'desc' };
    });
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  useEffect(() => {
    async function loadUsers() {
      try {
        const [agentsData, assignersData] = await Promise.all([
          getAllUsers({ role_id: '4,5' }),
          getAllUsers({ role_id: '3' }),
        ]);

        setAgents(agentsData);
        setAssigners(assignersData);

        const groups = [
          ...new Set(agentsData.map((a) => a.call_center).filter(Boolean)),
        ];
        setAgentGroups(groups);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    }

    async function loadCallCenters() {
      const data = await getAllCallCenters();
      setCallCenters(Array.isArray(data) ? data : []);
    }

    loadUsers();
    loadCallCenters();
  }, []);

  useEffect(() => {
    const result = cases.filter((row) => {
      if (filterOrigin.length > 0 && !filterOrigin.includes(row.origin)) {
        return false;
      }

      if (filterType.length > 0 && !filterType.includes(row.type)) {
        return false;
      }

      if (
        filterSubstatus.length > 0 &&
        !filterSubstatus.includes(row.substatus)
      ) {
        return false;
      }

      if (
        filterOwnerName.length > 0 &&
        !filterOwnerName.includes(row.ownerName)
      ) {
        return false;
      }

      if (filterAssignerId.length > 0) {
        const allowedAssignerNames = assigners
          .filter((u) => filterAssignerId.includes(u.id))
          .map((u) => u.fullname);

        if (!allowedAssignerNames.includes(row.ownerName)) return false;
      }

      if (
        filterSupplierSegment.length > 0 &&
        !filterSupplierSegment.includes(row.supplierSegment)
      ) {
        return false;
      }

      // ✅ AGENT GROUP
      if (filterAgentGroup.length > 0) {
        if (!row.assignedAgent) return false;
        if (!filterAgentGroup.includes(row.assignedAgent.call_center))
          return false;
      }

      // ✅ AGENT
      if (filterAgentId.length > 0) {
        if (filterAgentId.includes('Unassigned')) {
          if (row.assignedAgent) return false;
        } else {
          if (!row.assignedAgent) return false;
          if (!filterAgentId.includes(row.assignedAgent.fullname)) return false;
        }
      }

      if (attemptColorFilter.length > 0) {
        const value = getAttemptValue(row, attemptSource);
        const color = getAttemptColor(value);

        if (!attemptColorFilter.includes(color)) return false;
      }

      return true;
    });

    setFilteredCases(result);
  }, [
    cases,
    filterOrigin,
    filterType,
    filterSubstatus,
    filterSupplierSegment,
    filterOwnerName,
    filterAgentGroup,
    filterAgentId,
    attemptColorFilter,
    attemptSource,
  ]);

  useEffect(() => {
    const interval = setInterval(
      () => {
        fetchMonitoring(true);
      },
      10 * 60 * 1000
    );

    return () => clearInterval(interval);
  }, []);

  const clearFilters = () => {
    setFilterOrigin([]);
    setFilterType([]);
    setFilterSubstatus([]);
    setFilterSupplierSegment([]);
    setFilterAgentGroup([]);
    setFilterAgentId([]);
    setFilterOwnerName('');
    setFilterAssignerId([]);
  };

  const handleSetFilterAssignerId = (selectedNames) => {
    setFilterAssignerId(
      selectedNames
        .map((name) => assigners.find((a) => a.fullname === name)?.id)
        .filter(Boolean)
    );
  };

  const handleSearchAssignments = async () => {
    const hasFilter =
      searchFilters.startDate ||
      searchFilters.endDate ||
      searchFilters.assignedAgentId.length > 0 ||
      searchFilters.agentGroup.length > 0 ||
      searchFilters.assignedById.length > 0;

    if (!hasFilter) {
      CustomSwal.fire({
        icon: 'warning',
        title: 'Required Filter',
        text: 'Please select at least one filter.',
      });
      return;
    }

    try {
      const filters = {};

      if (searchFilters.startDate) filters.date_from = searchFilters.startDate;

      if (searchFilters.endDate) filters.date_to = searchFilters.endDate;

      if (searchFilters.assignedAgentId.length > 0) {
        filters.agent_id = searchFilters.assignedAgentId;
      }

      if (searchFilters.agentGroup.length > 0) {
        filters.call_center_id = searchFilters.agentGroup;
      }

      if (searchFilters.assignedById.length > 0) {
        filters.created_by = searchFilters.assignedById;
      }

      const data = await casesAssignmentsAll(filters);

      // 📊 Download Excel
      if (Array.isArray(data) && data.length > 0) {
        assignmentsReport(data);
      }

      CustomSwal.fire({
        icon: 'success',
        title: 'Search Completed',
        text: `Found ${data.length || 0} assignments.`,
      });

      console.log('data--', data);
      // 👉 AQUÍ puedes guardar resultados si quieres mostrarlos
      // setAssignments(data);

      setOpenSearchAssignments(false);

      setSearchFilters({
        startDate: '',
        endDate: '',
        assignedAgentId: [],
        agentGroup: [],
        assignedById: [],
      });
    } catch (error) {
      console.error('Error searching assignments:', error);

      CustomSwal.fire({
        icon: 'error',
        title: 'Search Failed',
        text: 'Error searching assignments.',
      });
    }
  };

  const headerDates = useMemo(() => {
    if (!filteredCases || filteredCases.length === 0) {
      return {
        date1: 'Today',
        date2: 'Yesterday',
        date3: '2 Days Ago',
      };
    }

    const firstRow = filteredCases[0];

    return {
      date1: firstRow.date1 ?? 'Today',
      date2: firstRow.date2 ?? 'Yesterday',
      date3: firstRow.date3 ?? '2 Days Ago',
    };
  }, [filteredCases]);

  const sortedCases = useMemo(() => {
    if (!sortConfig.key) return filteredCases;

    return [...filteredCases].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? 0;
      const bVal = b[sortConfig.key] ?? 0;

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCases, sortConfig]);

  const handleSearch = () => {
    const result = cases.filter((row) => {
      if (filterOrigin && row.origin !== filterOrigin) return false;
      if (filterType && row.type !== filterType) return false;
      if (filterSubstatus && row.substatus !== filterSubstatus) return false;
      if (filterOwnerName && row.ownerName !== filterOwnerName) return false;
      if (
        filterSupplierSegment &&
        row.supplierSegment !== filterSupplierSegment
      )
        return false;

      if (filterAgentGroup) {
        if (!row.assignedAgent) return false;
        if (row.assignedAgent.call_center !== filterAgentGroup) return false;
      }

      if (filterAgentId) {
        if (filterAgentId === '__UNASSIGNED__') {
          if (row.assignedAgent) return false;
        } else {
          if (!row.assignedAgent) return false;
          if (String(row.assignedAgent.id) !== String(filterAgentId))
            return false;
        }
      }

      return true;
    });

    setFilteredCases(result);
  };
  const toggleAttemptColor = (color) => {
    setAttemptColorFilter((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };
  const isRestricted = [4, 5].includes(user?.role_id);

  const colSpan = isRestricted ? 12 : 16;

  const colorStats = useMemo(() => {
    const stats = { red: 0, yellow: 0, green: 0 };

    filteredCases.forEach((row) => {
      const value = getAttemptValue(row, attemptSource);
      const color = getAttemptColor(value);
      if (color) stats[color]++;
    });

    return stats;
  }, [filteredCases, attemptSource]);

  return (
    <ScaleWrapper scale={0.6} buffer={40}>
      <div className=" mb-8 mt-12 flex flex-col gap-12">
        <Card>
          <CardHeader
            variant="gradient"
            style={{ backgroundColor: '#EEA11E' }}
            className="flex items-center justify-between p-6"
          >
            <div className="flex flex-col">
              <Typography variant="h4" color="white">
                Monitoring Cases
              </Typography>

              {lastUpdated && (
                <span className="text-lg text-orange-100 opacity-90">
                  Last updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchMonitoring(false)}
                disabled={loading}
                className={`flex items-center gap-2 rounded px-3 py-1 text-white transition
    ${
      loading
        ? 'cursor-not-allowed bg-gray-400'
        : 'bg-[#1A1A1A] hover:bg-[#000000]'
    }
  `}
              >
                <ArrowPathIcon
                  className={`flex h-5 w-5 ${loading ? 'animate-spin' : ''}`}
                />
                {loading ? 'Updating...' : 'Refresh'}
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  monitoringReport(
                    filteredCases,
                    `monitoring_${new Date().toISOString().slice(0, 10)}.xlsx`
                  )
                }
                className={`flex items-center gap-2 rounded px-3 py-1 text-white transition
    ${
      loading
        ? 'cursor-not-allowed bg-gray-400'
        : 'bg-[#1A1A1A] hover:bg-[#000000]'
    }
  `}
              >
                <DocumentArrowDownIcon className="h-5 w-5" />
                Export Excel
              </button>

              <button
                type="button"
                onClick={() => setOpenSearchAssignments(true)}
                disabled={loading}
                className={`flex items-center gap-2 rounded px-3 py-1 text-white transition
                ${loading ? 'cursor-not-allowed bg-gray-400' : 'bg-[#1A1A1A] hover:bg-[#000000]'}`}
              >
                Search Assignments
              </button>
            </div>
          </CardHeader>
          {openBulkAssign && (
            <AssignAgentModal
              caseNumbers={selectedCaseNumbers}
              onClose={() => setOpenBulkAssign(false)}
              onSaved={() => {
                setSelectedCaseNumbers([]);
                fetchMonitoring();
              }}
            />
          )}

          <Dialog
            open={openSearchAssignments}
            handler={() => setOpenSearchAssignments(false)}
            size="lg"
          >
            <DialogHeader>Search Case Assignments</DialogHeader>
            <DialogBody divider className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Typography variant="small" className="mb-2 font-medium">
                    Start Date
                  </Typography>
                  <Input
                    type="date"
                    value={searchFilters.startDate}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        startDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Typography variant="small" className="mb-2 font-medium">
                    End Date
                  </Typography>
                  <Input
                    type="date"
                    value={searchFilters.endDate}
                    onChange={(e) =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <MultiSelectFilter
                label="Assigned Agent"
                options={agents.map((a) => a.fullname)}
                value={searchFilters.assignedAgentId
                  .map((id) => {
                    const agent = agents.find((a) => a.id === id);
                    return agent ? agent.fullname : '';
                  })
                  .filter(Boolean)}
                disabled={searchFilters.agentGroup.length > 0}
                onChange={(selectedNames) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    assignedAgentId: selectedNames
                      .map(
                        (name) => agents.find((a) => a.fullname === name)?.id
                      )
                      .filter(Boolean),
                    agentGroup: selectedNames.length > 0 ? [] : prev.agentGroup,
                  }))
                }
              />

              <MultiSelectFilter
                label="Assigned By"
                options={assigners.map((a) => a.fullname)}
                value={searchFilters.assignedById
                  .map((id) => {
                    const user = assigners.find((a) => a.id === id);
                    return user ? user.fullname : '';
                  })
                  .filter(Boolean)}
                onChange={(selectedNames) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    assignedById: selectedNames
                      .map(
                        (name) => assigners.find((a) => a.fullname === name)?.id
                      )
                      .filter(Boolean),
                  }))
                }
              />

              <MultiSelectFilter
                label="Agent Group (Call Center)"
                options={callCenters.map((c) => c.name)}
                value={searchFilters.agentGroup
                  .map((id) => {
                    const cc = callCenters.find((c) => c.id === id);
                    return cc ? cc.name : '';
                  })
                  .filter(Boolean)}
                disabled={searchFilters.assignedAgentId.length > 0}
                onChange={(selectedNames) =>
                  setSearchFilters((prev) => ({
                    ...prev,
                    agentGroup: selectedNames
                      .map(
                        (name) => callCenters.find((c) => c.name === name)?.id
                      )
                      .filter(Boolean),
                    assignedAgentId:
                      selectedNames.length > 0 ? [] : prev.assignedAgentId,
                  }))
                }
              />
            </DialogBody>
            <DialogFooter>
              <Button
                variant="text"
                color="red"
                onClick={() => {
                  setOpenSearchAssignments(false);
                  setSearchFilters({
                    startDate: getPeruDateString(),
                    endDate: '',
                    assignedAgentId: [],
                    agentGroup: [],
                    assignedById: [],
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                variant="gradient"
                color="black"
                onClick={handleSearchAssignments}
              >
                Search
              </Button>
            </DialogFooter>
          </Dialog>
          <CardBody className="relative overflow-visible p-6">
            <MonitoringFilters
              cases={cases}
              agentGroups={agentGroups}
              assigners={assigners}
              filters={{
                filterOrigin,
                filterType,
                filterSubstatus,
                filterSupplierSegment,
                filterAgentGroup,
                filterAgentId,
                filterOwnerName,
                filterAssignerId,
              }}
              setters={{
                setFilterOrigin,
                setFilterType,
                setFilterSubstatus,
                setFilterSupplierSegment,
                setFilterAgentGroup,
                setFilterAgentId,
                setFilterOwnerName,
                handleSetFilterAssignerId,
              }}
              onSearch={handleSearch}
              onClear={clearFilters}
              user={user}
            />
          </CardBody>
          {selectedCaseNumbers.length > 0 && (
            <BulkActionsBar
              count={selectedCaseNumbers.length}
              onAssign={() => setOpenBulkAssign(true)}
              onClear={() => setSelectedCaseNumbers([])}
            />
          )}
          {/* Table Attempts */}
          <CardBody className="overflow-x-auto p-6 pb-24">
            <div className="mb-3 flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing <strong>{filteredCases.length}</strong> of{' '}
                <strong>{cases.length}</strong> records
              </span>
            </div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Attempts:</span>

              {[
                { key: 'attempts1', label: 'Today', title: 'Attempts today' },
                {
                  key: 'attempts2',
                  label: 'Yesterday',
                  title: 'Attempts yesterday',
                },
                {
                  key: 'attempts3',
                  label: '2 Days',
                  title: 'Attempts 2 days ago',
                },
                {
                  key: 'totalAttempts',
                  label: 'Total',
                  title: 'Total attempts',
                },
              ]
                .filter(
                  (item) =>
                    item.key === 'attempts1' || ![4, 5].includes(user?.role_id)
                )
                .map((item) => (
                  <button
                    key={item.key}
                    title={item.title}
                    onClick={() => {
                      setAttemptSource(item.key);
                      setAttemptColorFilter([]);
                    }}
                    className={`rounded px-3 py-1 font-medium transition ${
                      attemptSource === item.key
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
            </div>

            <div className="mb-4 flex items-center gap-3 text-sm">
              <span className="text-gray-500">Filter by attempts:</span>

              <button
                onClick={() => toggleAttemptColor('red')}
                className={`rounded px-2 py-1 transition ${
                  attemptColorFilter.includes('red')
                    ? 'bg-red-300 text-red-900'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                Red ({colorStats.red})
              </button>

              <button
                onClick={() => toggleAttemptColor('yellow')}
                className={`rounded px-2 py-1 transition ${
                  attemptColorFilter.includes('yellow')
                    ? 'bg-yellow-300 text-yellow-900'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                Yellow ({colorStats.yellow})
              </button>

              <button
                onClick={() => toggleAttemptColor('green')}
                className={`rounded px-2 py-1 transition ${
                  attemptColorFilter.includes('green')
                    ? 'bg-green-300 text-green-900'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                Green ({colorStats.green})
              </button>

              {attemptColorFilter.length > 0 && (
                <button
                  onClick={() => setAttemptColorFilter([])}
                  className="ml-2 text-xs text-gray-500 underline hover:text-gray-700"
                >
                  clear
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center">Loading data...</div>
            ) : (
              <table className="w-full min-w-[700px] table-fixed border-collapse border-2 border-[#1A1A1A]">
                <thead className="sticky top-0 z-10 bg-[#e07721] text-white">
                  <tr className="relative text-center">
                    {![4, 5].includes(user?.role_id) && (
                      <th
                        className="sticky left-0 z-20 border border-[#1A1A1A] bg-[#e07721] px-2 py-2"
                        style={{ width: '48px' }}
                      >
                        <input
                          type="checkbox"
                          checked={
                            sortedCases.length > 0 &&
                            selectedCaseNumbers.length === sortedCases.length
                          }
                          onChange={(e) =>
                            setSelectedCaseNumbers(
                              e.target.checked
                                ? sortedCases.map((c) => c.caseNumber)
                                : []
                            )
                          }
                        />
                      </th>
                    )}
                    <th
                      className={`sticky ${![4, 5].includes(user?.role_id) ? 'left-[48px]' : 'left-0'} z-20 border border-[#1A1A1A] bg-[#e07721] px-4 py-2`}
                      style={{ width: '150px' }}
                    >
                      Case Number
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '160px' }}
                    >
                      Full Name
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '120px' }}
                    >
                      Phone Number
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '300px' }}
                    >
                      Email
                    </th>

                    {![4, 5].includes(user?.role_id) && (
                      <th
                        className="border border-[#1A1A1A] px-4 py-2"
                        style={{ width: '220px' }}
                      >
                        Case Id
                      </th>
                    )}
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Owner Name
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '120px' }}
                    >
                      Origin
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Supplier Segment
                    </th>
                    <th
                      className="border border-[#1A1A1A] px-4 py-2"
                      style={{ width: '180px' }}
                    >
                      Type
                    </th>

                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Substatus
                    </th>
                    <th className="border border-[#1A1A1A] px-4 py-2">
                      Assigned Agent
                    </th>

                    <th
                      onClick={() => handleSort('createdDate')}
                      className="cursor-pointer border border-[#1A1A1A] px-4 py-2 hover:bg-[#d46f1d]"
                      style={{ width: '150px' }}
                    >
                      Created Date <br />
                      {headerDates.createdDate}
                      {sortConfig.key === 'createdDate' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>
                    <th
                      onClick={() => handleSort('attempts1')}
                      className="cursor-pointer border border-[#1A1A1A] px-4 py-2 hover:bg-[#d46f1d]"
                      style={{ width: '160px' }}
                    >
                      Attempts <br />
                      {headerDates.date1}
                      {sortConfig.key === 'attempts1' && (
                        <span className="ml-1">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </th>

                    {![4, 5].includes(user?.role_id) && (
                      <th
                        onClick={() => handleSort('attempts2')}
                        className="cursor-pointer border border-[#1A1A1A] px-4 py-2 hover:bg-[#d46f1d]"
                      >
                        Attempts <br />
                        {headerDates.date2}
                        {sortConfig.key === 'attempts2' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                    )}
                    {![4, 5].includes(user?.role_id) && (
                      <th
                        onClick={() => handleSort('attempts3')}
                        className="cursor-pointer border border-[#1A1A1A] px-4 py-2 hover:bg-[#d46f1d]"
                      >
                        Attempts <br />
                        {headerDates.date3}
                        {sortConfig.key === 'attempts3' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                    )}
                    {![4, 5].includes(user?.role_id) && (
                      <th
                        onClick={() => handleSort('totalAttempts')}
                        className="cursor-pointer border border-[#1A1A1A] px-4 py-2 hover:bg-[#d46f1d]"
                      >
                        Attempts Total
                        <br />
                        {sortConfig.key === 'totalAttempts' && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {sortedCases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={colSpan}
                        className="border px-4 py-6 text-center text-sm text-gray-500"
                      >
                        No cases found
                      </td>
                    </tr>
                  ) : (
                    sortedCases.map((row, idx) => (
                      <tr
                        key={row.id ?? idx}
                        className={`
    relative
    text-center
    align-middle
    transition-colors
    ${selectedCaseNumbers.includes(row.caseNumber) ? 'bg-indigo-100' : ''}
  `}
                      >
                        {![4, 5].includes(user?.role_id) && (
                          <td
                            className="cursor-pointer border border-[#1A1A1A] bg-inherit px-2 py-2 text-center align-middle"
                            onClick={(e) =>
                              toggleCaseSelection(row.caseNumber, idx, e)
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selectedCaseNumbers.includes(
                                row.caseNumber
                              )}
                              readOnly
                              className="pointer-events-none"
                            />
                          </td>
                        )}
                        <td
                          className={`sticky ${![4, 5].includes(user?.role_id) ? 'left-[48px]' : 'left-0'} z-10 border border-[#1A1A1A] bg-inherit px-4 py-2 align-middle`}
                        >
                          {row.caseId ? (
                            <button
                              type="button"
                              onClick={() =>
                                window.open(
                                  `https://imgpe.lightning.force.com/lightning/r/Case/${row.caseId}/view`,
                                  '_blank',
                                  'noopener,noreferrer'
                                )
                              }
                              className="font-medium text-[#492508] hover:text-[#2E1606]"
                            >
                              {row.caseNumber}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>

                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.fullName ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.phoneNumber ?? '-'}
                        </td>
                        <td className="truncate border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.email ?? '-'}
                        </td>
                        {![4, 5].includes(user?.role_id) && (
                          <td className="truncate border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                            {row.caseId ?? '-'}
                          </td>
                        )}
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.ownerName ?? '-'}
                        </td>

                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.origin ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.supplierSegment ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.type ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.substatus ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          <AgentCell
                            row={row}
                            onUpdated={fetchMonitoring}
                            isEditable={![4, 5].includes(user?.role_id)}
                          />
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          {row.createdDate ?? '-'}
                        </td>
                        <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                          <span
                            className={`inline-block min-w-[40px] rounded px-2 py-1 font-semibold ${getAttemptClass(
                              row.attempts1
                            )}`}
                          >
                            {row.attempts1 ?? '-'}
                          </span>
                        </td>

                        {![4, 5].includes(user?.role_id) && (
                          <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                            <span
                              className={`inline-block min-w-[40px] rounded px-2 py-1 font-semibold ${getAttemptClass(
                                row.attempts2
                              )}`}
                            >
                              {row.attempts2 ?? '-'}
                            </span>
                          </td>
                        )}
                        {![4, 5].includes(user?.role_id) && (
                          <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                            <span
                              className={`inline-block min-w-[40px] rounded px-2 py-1 font-semibold ${getAttemptClass(
                                row.attempts3
                              )}`}
                            >
                              {row.attempts3 ?? '-'}
                            </span>
                          </td>
                        )}
                        {![4, 5].includes(user?.role_id) && (
                          <td className="border border-[#1A1A1A] px-4 py-2 text-center align-middle">
                            <span
                              className={`inline-block min-w-[40px] rounded px-2 py-1 font-semibold ${getAttemptClass(
                                row.totalAttempts
                              )}`}
                            >
                              {row.totalAttempts ?? '-'}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>
      </div>
    </ScaleWrapper>
  );
}

export default Monitoring;
