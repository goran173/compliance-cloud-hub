import React, { useEffect, useState } from "react";

interface Log {
  id: string;
  status: string;
  source: string;
  details: string | null;
  createdAt: string;
  customerEmail: string;
  merchant: {
    email: string;
  };
}

interface LogsTableProps {
  logs?: Log[];
  hideHeader?: boolean;
}

const LogsTable: React.FC<LogsTableProps> = ({
  logs: initialLogs,
  hideHeader = false,
}) => {
  // Internal state for when we fetch logs ourselves
  const [internalLogs, setInternalLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(!initialLogs);

  // Derive the logs to display: prefer props if available, otherwise use internal state
  const logs = initialLogs || internalLogs;

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10); // Standard page size

  // Expansion State
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // fetchLogs moved inside useEffect

  useEffect(() => {
    // If props are provided (Dashboard mode), use them and don't fetch/paginate
    if (initialLogs) {
      return;
    }

    const fetchLogs = (pageNum: number) => {
      setLoading(true);
      fetch(`/api/logs?page=${pageNum}&limit=${limit}`)
        .then((res) => res.json())
        .then((data) => {
          // Handle both new format (paginated) and old format (array) gracefully
          if (Array.isArray(data)) {
            setInternalLogs(data);
            setTotalPages(1);
          } else {
            setInternalLogs(data.logs);
            setTotalPages(data.totalPages);
            setPage(data.page);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch logs", err);
          setLoading(false);
        });
    };

    // Otherwise (History mode), fetch paginated data
    fetchLogs(page);
  }, [initialLogs, page, limit]);

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const formatDetailsShort = (details: string | null) => {
    if (!details) return "-";
    try {
      const parsed = JSON.parse(details);
      if (Array.isArray(parsed)) return `${parsed.length} items...`;
      if (parsed.customer?.email) return "Webhook Payload";
      return "JSON Data";
    } catch {
      return details.substring(0, 30) + "...";
    }
  };

  const formatDetailsFull = (details: string | null) => {
    if (!details) return "No details provided.";
    try {
      // Pretty print JSON
      return (
        <pre className="text-xs text-slate-600 bg-slate-50 p-4 rounded-md overflow-x-auto">
          {JSON.stringify(JSON.parse(details), null, 2)}
        </pre>
      );
    } catch {
      return (
        <div className="text-sm text-slate-600 bg-slate-50 p-4 rounded-md">
          {details}
        </div>
      );
    }
  };

  if (!initialLogs && loading) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        Loading logs...
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {!hideHeader && (
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-semibold text-slate-900">
            Deletion Logs
          </h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Target Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {logs.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-8 text-center text-sm text-gray-500"
                >
                  No logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr
                    onClick={() => toggleExpand(log.id)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 ${expandedRowId === log.id ? "bg-slate-50" : ""}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {log.customerEmail || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          log.status === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : log.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                      {formatDetailsShort(log.details)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-400">
                      {expandedRowId === log.id ? "▲" : "▼"}
                    </td>
                  </tr>
                  {expandedRowId === log.id && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-4 bg-white border-b border-slate-100 shadow-inner"
                      >
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Full Details
                          </div>
                          {formatDetailsFull(log.details)}
                          <div className="text-xs text-slate-400 mt-2">
                            Source: {log.source} • ID: {log.id}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Only show in History Mode (when no initialLogs prop) */}
      {!initialLogs && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page <span className="font-medium">{page}</span> of{" "}
            <span className="font-medium">{totalPages}</span>
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default LogsTable;
