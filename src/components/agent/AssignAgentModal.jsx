import { useEffect, useState } from 'react';
import { getAllUsers } from '../../services/users/getUsers';
import { assignAgents } from '../../services/caseAssignments/assignAgent';
import { createPortal } from 'react-dom';

function groupByCallCenter(list) {
  return list.reduce((acc, agent) => {
    acc[agent.callCenter.name] = acc[agent.callCenter.name] || [];
    acc[agent.callCenter.name].push(agent);
    return acc;
  }, {});
}

export default function AssignAgentModal({
  caseNumber,
  caseNumbers,
  currentAgent,
  onClose,
  onSaved,
}) {
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(
    currentAgent?.id ?? null
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAgents() {
      const filters = {
        role_id: '4,5',
      };
      const data = await getAllUsers(filters);
      setAgents(data);
    }
    loadAgents();
  }, []);

  async function handleSave() {
    setLoading(true);

    if (Array.isArray(caseNumbers) && caseNumbers.length > 0) {
      await Promise.all(
        caseNumbers.map((cn) =>
          assignAgents({ caseNumber: cn, agentId: selectedAgentId })
        )
      );
    } else if (caseNumber) {
      await assignAgents({
        caseNumber,
        agentId: selectedAgentId,
      });
    }
    const selectedAgent = agents.find((a) => a.id === selectedAgentId) || null;

    setLoading(false);
    onClose();
    onSaved?.(selectedAgent);
  }

  const groupedAgents = groupByCallCenter(agents);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          Assign Agent
        </h3>

        <div className="max-h-[50vh] space-y-4 overflow-y-auto">
          {Object.entries(groupedAgents).map(([group, list]) => (
            <div key={group}>
              <h4 className="mb-2 text-sm font-semibold text-gray-600">
                {group}
              </h4>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {list.map((agent) => (
                  <label
                    key={agent.id}
                    className="flex cursor-pointer items-center gap-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="agent"
                      checked={selectedAgentId === agent.id}
                      onChange={() => setSelectedAgentId(agent.id)}
                    />
                    <span>{agent.fullname}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setSelectedAgentId(null)}
            className="text-sm text-red-600 hover:underline"
          >
            Remove agent
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById('modal-root')
  );
}
