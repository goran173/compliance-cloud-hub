import React from "react";

const IntegrationsCard: React.FC = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
      <div className="grid gap-4">
        {/* Shopify - Connected (Simulated) */}
        <div className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg">
          <div className="flex items-center space-x-3">
            {/* Shopify Icon Placeholder */}
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Shopify</p>
              <p className="text-xs text-green-700">Connected</p>
            </div>
          </div>
        </div>

        {/* Jira */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              J
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Jira</p>
              <p className="text-xs text-gray-500">Not connected</p>
            </div>
          </div>
          <button className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors">
            Connect
          </button>
        </div>

        {/* Salesforce */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              SF
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Salesforce</p>
              <p className="text-xs text-gray-500">Not connected</p>
            </div>
          </div>
          <button className="px-3 py-1.5 text-sm font-medium text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-md transition-colors">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationsCard;
