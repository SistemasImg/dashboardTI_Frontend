import { useEffect, useState, useMemo } from 'react';
import { Card, CardBody, Typography, Chip } from '@material-tailwind/react';
import { summary } from '@/services/summary';
import { useAuth } from '@/context/loginContext';
import { casesAssignments } from '@/services/caseAssignments/getCasesAssignments';
import AgentCasesCard from '@/components/home/AgentCasesCard';

export function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);

  const isRestrictedRole = user?.role_id === 4 || user?.role_id === 5;

  useEffect(() => {
    if (isRestrictedRole) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        const [summaryRes, assignmentsRes] = await Promise.all([
          summary(),
          casesAssignments(),
        ]);

        setData(summaryRes);
        setAssignments(assignmentsRes || []);
      } catch (error) {
        console.error('Error loading home data', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [isRestrictedRole]);

  const groupedByAgent = useMemo(() => {
    const grouped = {};

    assignments.forEach((item) => {
      const agentName = item.agent?.fullname || 'Unassigned';

      if (!grouped[agentName]) {
        grouped[agentName] = {
          call_center: item.agent?.call_center,
          cases: [],
        };
      }

      grouped[agentName].cases.push(item.case_number);
    });

    return grouped;
  }, [assignments]);

  const assignmentsByAgent = useMemo(() => {
    const grouped = {};

    assignments
      .filter((a) => !a.unassigned_at)
      .forEach((item) => {
        const agentName = item.agent?.fullname || 'Unassigned';
        const callCenter = item.agent?.call_center || '-';

        if (!grouped[agentName]) {
          grouped[agentName] = {
            fullname: agentName,
            call_center: callCenter,
            total: 0,
          };
        }

        grouped[agentName].total += 1;
      });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [assignments]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Typography>Loading dashboard...</Typography>
      </div>
    );
  }

  if (isRestrictedRole) {
    return <BasicHome user={user} />;
  }

  if (!data) return null;

  return (
    <div className="space-y-16 p-6">
      <section>
        {/* ===== TITLE ===== */}
        <div className="mb-8 text-black">
          <h1 className="text-2xl font-bold">
            Welcome{user?.fullname ? `, ${user.fullname}` : ''}
          </h1>
          <p className="mt-1 text-sm">Platform status overview in real time.</p>
        </div>

        {/* ===== CONNECTION STATUS ===== */}
        <div className="flex gap-4">
          <StatusCard label="Salesforce" status={data.connections.salesforce} />
          <StatusCard label="SQL Server" status={data.connections.sqlserver} />
        </div>
      </section>

      {/* ===== ASSIGNED CASES BY AGENT ===== */}
      <section className="border-t">
        <div className="mt-10">
          <Typography variant="h5" className="mb-4">
            Cases Assigned Per Agent
          </Typography>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {Object.entries(groupedByAgent).map(([agentName, data]) => (
              <AgentCasesCard
                key={agentName}
                agentName={agentName}
                callCenter={data.call_center}
                cases={data.cases}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== METRICS ===== */}
      <section className="border-t pt-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Total Users" value={data.users.total} />
          <MetricCard title="Total Agents" value={data.agents.total} />
          <MetricCard
            title="Average Daily Attempts"
            value={data.attemptsDaily.total}
          />
          <MetricCard
            title="Assigned Cases"
            value={data.caseAssignments.total}
          />
          <MetricCard
            title="Infobit Messages"
            value={data.infobitMessages.total}
          />
          <MetricCard
            title="Salesforce Opportunities"
            value={data.salesforceOpportunities.total}
          />
        </div>
      </section>

      {/* ===== LAST RECORDS ===== */}
      <section className="border-t pt-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <LastRecord
            title="Last User Created"
            name={data.users.last?.fullname}
            extra={data.users.last?.Role.name}
            date={data.users.last?.created_at}
          />

          <LastRecord
            title="Last Agent Added"
            name={data.agents.last?.fullname}
            extra={data.agents.last?.callCenter.name}
            date={data.agents.last?.created_at}
          />
        </div>
      </section>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function StatusCard({ label, status }) {
  const isConnected = status === 'connected';

  return (
    <Card className="w-48">
      <CardBody className="flex flex-col gap-2">
        <Typography className="text-sm font-medium">{label}</Typography>
        <Chip
          value={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'green' : 'red'}
          variant="filled"
          size="sm"
        />
      </CardBody>
    </Card>
  );
}

function MetricCard({ title, value }) {
  return (
    <Card>
      <CardBody>
        <Typography className="text-sm text-gray-600">{title}</Typography>
        <Typography variant="h4" className="font-bold">
          {value}
        </Typography>
      </CardBody>
    </Card>
  );
}

function AssignmentsTable({ data }) {
  return (
    <Card>
      <CardBody>
        <Typography className="mb-4 text-sm text-gray-600">
          Cases Assigned Per Agent
        </Typography>

        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b text-left text-sm text-gray-500">
                <th className="py-2">Agent</th>
                <th className="py-2">Call Center</th>
                <th className="py-2 text-right">Assigned Cases</th>
              </tr>
            </thead>
            <tbody>
              {data.map((agent, index) => (
                <tr
                  key={index}
                  className="border-b transition hover:bg-gray-50"
                >
                  <td className="py-2 font-medium">{agent.fullname}</td>
                  <td className="py-2 text-gray-500">{agent.call_center}</td>
                  <td className="py-2 text-right font-bold">{agent.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

function LastRecord({ title, name, extra, date }) {
  return (
    <Card>
      <CardBody className="space-y-1">
        <Typography className="text-sm text-gray-600">{title}</Typography>
        <Typography className="font-semibold">{name || '-'}</Typography>
        {extra && (
          <Typography className="text-xs text-gray-500">{extra}</Typography>
        )}
        <Typography className="text-xs text-gray-400">
          {date
            ? new Date(date).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
            : '-'}
        </Typography>
      </CardBody>
    </Card>
  );
}

function BasicHome({ user }) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <img
        src="https://illustrations.popsy.co/gray/work-from-home.svg"
        alt="Welcome"
        className="mb-8 w-72"
      />

      <h1 className="mb-3 text-3xl font-bold">
        Welcome{user?.fullname ? `, ${user.fullname}` : ''} 👋
      </h1>

      <p className="max-w-md text-gray-600">
        We're excited to have you here. Everything is set up and ready — explore
        your workspace and make the most of your experience.
      </p>
    </div>
  );
}
