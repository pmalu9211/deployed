import {
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  Card,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from "axios";

const BACKEND_UPLOAD_URL = import.meta.env.VITE_BACKEND_URL;

type LogEntry = {
  timestamp?: string;
  entry: string;
};

type DeploymentStatus =
  | "idle"
  | "uploading"
  | "deploying"
  | "deployed"
  | "failed";

export function Landing() {
  const [repoUrl, setRepoUrl] = useState("");
  const [uploadId, setUploadId] = useState("");
  const [status, setStatus] = useState<DeploymentStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch logs periodically when deployment is in progress
  useEffect(() => {
    if (!uploadId || status === "idle") return;

    const fetchLogs = async () => {
      try {
        const res = await axios.get(
          `${BACKEND_UPLOAD_URL}/logs?id=${uploadId}`
        );
        setLogs((e) => e.concat(res.data.logs) || e);
      } catch (error) {
        console.error("Error fetching logs:", error);
      }
      if (status == "deployed" || status == "failed") {
        clearInterval(logsInterval);
      }
    };

    // Initial fetch
    fetchLogs();

    // Set up periodic fetching
    const logsInterval = setInterval(fetchLogs, 800);

    return () => clearInterval(logsInterval);
  }, [uploadId, status]);

  // Check deployment status periodically
  useEffect(() => {
    if (
      !uploadId ||
      status === "idle" ||
      status === "deployed" ||
      status === "failed"
    )
      return;

    const checkStatus = async () => {
      try {
        const response = await axios.get(
          `${BACKEND_UPLOAD_URL}/status?id=${uploadId}`
        );

        if (response.data.status === "deployed") {
          setStatus("deployed");
          clearInterval(statusInterval);
        } else if (response.data.status === "failed") {
          setStatus("failed");
          setError(
            response.data.error ||
              "Deployment failed. Please check the logs for details."
          );
          clearInterval(statusInterval);
        }
      } catch (error) {
        console.error("Error checking status:", error);
        setStatus("failed");
        setError("Failed to check deployment status. Please try again.");
      }
    };

    const statusInterval = setInterval(checkStatus, 3000);

    return () => clearInterval(statusInterval);
  }, [uploadId, status]);

  const handleDeploy = async () => {
    try {
      setStatus("uploading");
      setError(null);

      const res = await axios.post(`${BACKEND_UPLOAD_URL}/deploy`, {
        repoUrl: repoUrl,
      });

      setUploadId(res.data.id);
      setStatus("deploying");
    } catch (error) {
      setStatus("failed");
      setError(
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Failed to start deployment. Please try again."
      );
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen  p-4 mt-12 ">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-4xl">
            Deploy your GitHub Repository
          </CardTitle>
          <CardDescription className="text-md">
            Enter the URL of your GitHub repository to deploy it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-2xl" htmlFor="github-url">
                GitHub Repository URL
              </Label>
              <Input
                className="text-xl"
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                disabled={status !== "idle"}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Deployment Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleDeploy}
              disabled={status !== "idle"}
              className="w-full text-xl bg-blue-400"
              type="submit"
            >
              {status === "uploading"
                ? "Uploading..."
                : status === "deploying"
                ? `Deploying (${uploadId})`
                : "Deploy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Always show logs card when there's an uploadId */}
      {uploadId && (
        <Card className="w-full max-w-2xl mt-8 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-4xl">
              {status === "deployed"
                ? "Deployment Complete"
                : status === "failed"
                ? "Deployment Failed"
                : "Deployment in Progress"}
            </CardTitle>
            <CardDescription className="text-md">
              {status === "deployed"
                ? "Your website is successfully deployed!"
                : status === "failed"
                ? "Deployment encountered an error"
                : "Deploying your repository..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "deployed" && (
              <>
                <div className="space-y-2">
                  <Label className="text-2xl" htmlFor="deployed-url">
                    Deployed URL
                  </Label>
                  <Input
                    className="text-xl"
                    id="deployed-url"
                    readOnly
                    type="url"
                    value={`http://${uploadId}.dev.100xdevs.com:3001/index.html`}
                  />
                </div>
                <Button
                  className="w-full mt-4 text-xl bg-blue-400"
                  variant="outline"
                >
                  <a
                    href={`http://${uploadId}.10kdevs.com/index.html`}
                    target="_blank"
                  >
                    Visit Website
                  </a>
                </Button>
              </>
            )}

            {/* Always show logs when available */}
            {logs.length > 0 && (
              <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md max-h-64 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2">Deployment Logs:</h2>
                <ul className="text-sm">
                  {logs.map((log, index) => (
                    <li key={index} className="mb-1 font-mono">
                      <span className="text-gray-500 inline-block py-2">
                        {log.timestamp || ""}
                      </span>{" "}
                      {log.entry}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
