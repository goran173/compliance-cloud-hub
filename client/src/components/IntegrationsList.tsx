import React, { useEffect, useState } from "react";

interface Integration {
  id: string;
  platform: "JIRA" | "SALESFORCE";
  isActive: boolean;
  instanceUrl?: string;
}

const IntegrationsList: React.FC = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/merchant/integrations")
      .then((res) => res.json())
      .then((data) => {
        // data.integrations is the array
        setIntegrations(data.integrations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching integrations:", err);
        setLoading(false);
      });
  }, []);

  const isConnected = (platform: string) => {
    return integrations.some((i) => i.platform === platform && i.isActive);
  };

  if (loading)
    return <div className="text-gray-500 text-sm">Loading integrations...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
      <div className="grid gap-4">
        {/* Salesforce Card */}
        <div
          className={`flex items-center justify-between p-4 border rounded-lg ${isConnected("SALESFORCE") ? "border-sky-200 bg-sky-50" : "border-gray-200"}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              SF
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Salesforce</p>
              <p
                className={`text-xs ${isConnected("SALESFORCE") ? "text-sky-700" : "text-gray-500"}`}
              >
                {isConnected("SALESFORCE") ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {!isConnected("SALESFORCE") && (
            <a
              href="/api/auth/salesforce"
              className="px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors"
            >
              Connect
            </a>
          )}
        </div>

        {/* Jira Card */}
        <div
          className={`flex items-center justify-between p-4 border rounded-lg ${isConnected("JIRA") ? "border-blue-200 bg-blue-50" : "border-gray-200"}`}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              J
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Jira</p>
              <p
                className={`text-xs ${isConnected("JIRA") ? "text-blue-700" : "text-gray-500"}`}
              >
                {isConnected("JIRA") ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          {!isConnected("JIRA") && (
            <a
              href="/api/auth/jira"
              className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Connect
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntegrationsList;
