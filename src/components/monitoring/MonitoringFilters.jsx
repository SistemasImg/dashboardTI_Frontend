import { TrashIcon } from '@heroicons/react/24/outline';
import MultiSelectFilter from '@/components/monitoring/MultiSelectFilter';
import SubstatusMultiSelect from './SubstatusMultiSelect';

export default function MonitoringFilters({
  cases,
  agentGroups = [],
  agents = [],
  assigners = [],
  filters,
  setters,
  onClear,
  user,
}) {
  const uniqueValues = (key) => [
    ...new Set(cases.map((c) => c[key]).filter(Boolean)),
  ];

  const agentGroupsFromCases = [
    ...new Set(cases.map((c) => c.assignedAgent?.call_center).filter(Boolean)),
  ];

  const filteredAgents = [
    ...new Map(
      cases
        .map((c) => c.assignedAgent)
        .filter((a) => a && a.fullname && a.fullname !== 'null')
        .map((a) => [a.fullname, a]) // key = fullname
    ).values(),
  ];

  return (
    <div className="mb-4 flex flex-wrap items-end gap-4">
      {/* OWNER */}
      <MultiSelectFilter
        label="Owner Name"
        options={[...new Set(cases.map((c) => c.ownerName).filter(Boolean))]}
        value={filters.filterOwnerName}
        onChange={setters.setFilterOwnerName}
      />

      {/* ORIGIN */}
      <MultiSelectFilter
        label="Origin"
        options={uniqueValues('origin')}
        value={filters.filterOrigin}
        onChange={setters.setFilterOrigin}
      />

      {/* TYPE */}
      <MultiSelectFilter
        label="Type"
        options={uniqueValues('type')}
        value={filters.filterType}
        onChange={setters.setFilterType}
      />

      {/* SUBSTATUS */}
      <SubstatusMultiSelect
        options={uniqueValues('substatus')}
        value={filters.filterSubstatus}
        onChange={setters.setFilterSubstatus}
      />

      {/* SUPPLIER SEGMENT */}
      <MultiSelectFilter
        label="Supplier Segment"
        options={uniqueValues('supplierSegment')}
        value={filters.filterSupplierSegment}
        onChange={setters.setFilterSupplierSegment}
      />

      {/* AGENT GROUP */}
      {![4, 5].includes(user?.role_id) && (
        <MultiSelectFilter
          label="Agent Group"
          options={agentGroupsFromCases}
          value={filters.filterAgentGroup}
          onChange={setters.setFilterAgentGroup}
        />
      )}

      {/* AGENT */}
      {![4, 5].includes(user?.role_id) && (
        <MultiSelectFilter
          label="Agent"
          options={['Unassigned', ...filteredAgents.map((a) => a.fullname)]}
          value={filters.filterAgentId}
          onChange={setters.setFilterAgentId}
        />
      )}

      {/* CLEAR */}
      <button
        onClick={onClear}
        className="flex items-center gap-2 rounded bg-gray-300 px-3 py-2"
      >
        <TrashIcon className="h-5 w-5" />
        Clear
      </button>
    </div>
  );
}
