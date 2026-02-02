const PrivacyPolicy = () => {
  return (
    <div className="p-8 max-w-2xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

      <h2 className="text-xl font-bold mt-6 mb-2">1. Data Collection</h2>
      <p className="mb-2">
        Compliance Cloud Hub only stores the following data:
      </p>
      <ul className="list-disc ml-6 mb-4">
        <li>Merchant Shop Domain (to identify your account).</li>
        <li>Deletion Logs (Email address and status of GDPR requests).</li>
      </ul>

      <h2 className="text-xl font-bold mt-6 mb-2">2. Data Usage</h2>
      <p className="mb-4">
        We use this data solely to process "Right to be Forgotten" requests
        across your connected platforms (Jira, Salesforce).
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">3. Data Retention</h2>
      <p className="mb-4">
        Audit logs are retained for 30 days and then automatically anonymized.
      </p>

      <h2 className="text-xl font-bold mt-6 mb-2">4. Contact</h2>
      <p>For privacy concerns, contact: mag.digitalsolutions@gmail.com</p>
    </div>
  );
};

export default PrivacyPolicy;
