import React from "react";
import Layout from "../components/Layout";
import LogsTable from "../components/LogsTable";

const History: React.FC = () => {
  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">History</h2>
        <p className="text-slate-500 mt-1">
          Deletion requests and compliance activity across your integrations.
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-base font-semibold text-slate-900">
            Request history
          </h3>
          <p className="text-sm text-slate-500 mt-0.5">
            GDPR/CCPA deletion and redaction events
          </p>
        </div>
        <LogsTable />
      </div>
    </Layout>
  );
};

export default History;
