import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import LogsTable from "../components/LogsTable";
import toast, { Toaster } from "react-hot-toast";

interface Integration {
  id: string;
  platform: string;
  isActive: boolean;
}

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

interface DashboardData {
  merchant?: {
    shopDomain: string;
    email: string;
  };
  integrations?: Integration[];
  logs?: Log[];
  jiraStatus?: string;
}

// Updated Helper: Retries finding the token if Shopify isn't ready yet
const getSessionToken = async () => {
  // Retry up to 10 times (5 seconds max)
  for (let i = 0; i < 10; i++) {
    if (window.shopify && window.shopify.id) {
      try {
        return await window.shopify.id.getIdToken();
      } catch (e) {
        console.warn("Token fetch failed, retrying...", e);
      }
    }
    // Wait 500ms before trying again
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return null;
};

// --- HELPER: Get Shop from URL or Storage ---
const getShop = () => {
  const params = new URLSearchParams(window.location.search);
  const shopFromUrl = params.get("shop");
  if (shopFromUrl) {
    localStorage.setItem("shopify_domain", shopFromUrl);
    return shopFromUrl;
  }
  return localStorage.getItem("shopify_domain");
};

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const shop = getShop();
      console.log("Current URL:", window.location.href);

      if (!shop) {
        toast.error("Could not detect Shop Domain. Try reloading.");
        setLoading(false);
        return;
      }

      // 1. GENERATE TOKEN (This wakes up the Shopify Bot!)
      const token = await getSessionToken();
      console.log("Session Token Generated:", token ? "YES" : "NO");

      // 2. Add Token to Headers
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      try {
        // Fetch Dashboard Data
        const res = await fetch(`/api/dashboard-data?shop=${shop}`, {
          headers,
        });
        if (!res.ok) throw new Error(`Server Error: ${res.status}`);
        const data = await res.json();
        setData((prev) => ({ ...prev, ...data }));

        // Fetch Logs
        const logsRes = await fetch(`/api/logs?shop=${shop}`, { headers });
        const logsData = await logsRes.json();

        let safeLogs: Log[] = [];
        if (Array.isArray(logsData)) safeLogs = logsData;
        else if (logsData && Array.isArray(logsData.logs))
          safeLogs = logsData.logs;

        setData((prev) => ({ ...prev, logs: safeLogs }));
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Handle Connect (Submit Form)
  const handleJiraSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const shop = getShop(); // Get shop again
    const form = e.currentTarget;

    const domainInput = form.elements.namedItem("domain") as HTMLInputElement;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const tokenInput = form.elements.namedItem("token") as HTMLInputElement;

    if (!domainInput.value || !emailInput.value || !tokenInput.value) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsConnecting(true);

    try {
      const res = await fetch("/api/integrations/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopDomain: shop,
          domain: domainInput.value,
          email: emailInput.value,
          token: tokenInput.value,
        }),
      });

      if (res.ok) {
        toast.success("Jira connected successfully!");
        setData((prev) =>
          prev
            ? {
                ...prev,
                jiraStatus: "Connected",
                integrations: [
                  ...(prev.integrations || []),
                  { id: "temp", platform: "JIRA", isActive: true },
                ],
              }
            : null,
        );
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to connect");
      }
    } catch (err) {
      console.error("Error connecting Jira:", err);
      toast.error("Network error. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  // 3. Handle Disconnect
  const handleJiraDisconnect = async () => {
    const shop = getShop();
    setIsDisconnecting(true);

    try {
      const res = await fetch("/api/integrations/jira", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopDomain: shop }),
      });

      if (res.ok) {
        toast.success("Jira disconnected successfully");
        setData((prev) =>
          prev
            ? {
                ...prev,
                jiraStatus: "Disconnected",
                integrations:
                  prev.integrations?.filter((i) => i.platform !== "JIRA") || [],
              }
            : null,
        );
      } else {
        toast.error("Failed to disconnect");
      }
    } catch (err) {
      console.error("Error disconnecting:", err);
      toast.error("Network error");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-500">Connecting to Compliance Cloud...</p>
        </div>
      </Layout>
    );
  }

  // Determine Status
  const jiraIntegration = data?.integrations?.find(
    (i) => i.platform === "JIRA",
  );
  const isConnected =
    data?.jiraStatus === "Connected" || jiraIntegration?.isActive;

  return (
    <Layout>
      <Toaster position="top-right" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* 1. Shopify Status Card (Always Active) */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-900">Shopify</h3>
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
              Connected
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Store:{" "}
            <span className="font-medium text-slate-700">
              {data?.merchant?.shopDomain || getShop()}
            </span>
          </p>
        </div>

        {/* 2. JIRA CARD (Active) */}
        <div className="p-4 bg-white rounded-lg shadow-sm border border-slate-200 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#0052CC] rounded flex items-center justify-center text-white font-bold text-xs">
                Jira
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Atlassian Jira
              </h3>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${isConnected ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200"}`}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </span>
          </div>

          <p className="text-slate-500 text-xs mb-4 flex-grow">
            Auto-redact personal data from support tickets upon GDPR request.
          </p>

          {isConnected ? (
            <div className="space-y-3">
              <button className="w-full py-2 bg-green-500 text-white rounded font-medium cursor-default opacity-90">
                ✓ Active & Protecting
              </button>
              <button
                onClick={handleJiraDisconnect}
                disabled={isDisconnecting}
                className="w-full py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect"}
              </button>
            </div>
          ) : (
            <form onSubmit={handleJiraSubmit} className="space-y-3">
              <input
                name="domain"
                placeholder="example.atlassian.net"
                className="w-full p-2 border rounded text-sm"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="admin@email.com"
                className="w-full p-2 border rounded text-sm"
                required
              />
              <input
                name="token"
                type="password"
                placeholder="API Token"
                className="w-full p-2 border rounded text-sm"
                required
              />
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isConnecting ? "Connecting..." : "Connect Jira"}
              </button>
              <div className="text-center">
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  className="text-xs text-blue-500 underline"
                  rel="noreferrer"
                >
                  Get API Token
                </a>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Rest of the "Coming Soon" Cards below... (Keeping your existing layout) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Salesforce */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-60 flex flex-col grayscale">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#00A1E0] rounded flex items-center justify-center text-white font-bold text-xs">
                SF
              </div>
              <h3 className="font-semibold text-sm text-slate-900">
                Salesforce
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 uppercase tracking-wide">
              Soon
            </span>
          </div>
          <p className="text-gray-500 text-sm mb-6 flex-grow">
            Automatically delete Leads and Contacts to ensure CRM compliance.
          </p>
          <button
            disabled
            className="w-full py-2 bg-gray-200 text-gray-400 rounded-md font-medium text-xs cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Slack */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-60 flex flex-col grayscale">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#4A154B] rounded flex items-center justify-center text-white font-bold text-xs">
                #
              </div>
              <h3 className="font-semibold text-sm text-slate-900">Slack</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 uppercase tracking-wide">
              Soon
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-4 flex-grow">
            Scan and redact PII from public channels and private messages.
          </p>
          <button
            disabled
            className="w-full py-2 bg-gray-200 text-gray-400 rounded-md font-medium text-xs cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Klaviyo */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 opacity-60 flex flex-col grayscale">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-900 rounded flex items-center justify-center text-white font-bold text-xs">
                K
              </div>
              <h3 className="font-semibold text-sm text-slate-900">Klaviyo</h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-500 uppercase tracking-wide">
              Soon
            </span>
          </div>
          <p className="text-slate-500 text-xs mb-4 flex-grow">
            Process data deletion requests for email subscribers and list
            profiles.
          </p>
          <button
            disabled
            className="w-full py-2 bg-gray-200 text-gray-400 rounded-md font-medium text-xs cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Deletion Logs
          </h3>
        </div>
        <LogsTable logs={data?.logs || []} />
      </div>
    </Layout>
  );
};

export default Dashboard;
