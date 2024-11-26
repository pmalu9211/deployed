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
import LoadingDots from "./LoadindDots";
import { DeploymentStatus, LogEntry } from "@/types";
import GoToDeployment from "./blocks/GoToDeployment";
const BACKEND_UPLOAD_URL = import.meta.env.VITE_BACKEND_URL;

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

  const sanitizeLogs = (log: string) => log.replace(/[^\x20-\x7E]/g, "");

  return (
    <main className="flex flex-col items-center justify-center  bg-black min-h-[calc(100vh)] text-white p-4">
      {status === "deployed" ? (
        <GoToDeployment uploadId={uploadId} />
      ) : (
        <Card className="w-full max-w-2xl bg-gray-800 shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-cyan-300">
              Deploy your Frontend(React App)
            </CardTitle>
            <CardDescription className="text-sm text-gray-200">
              Enter the URL of your GitHub repository to deploy it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-lg text-white" htmlFor="github-url">
                  GitHub Repository URL:
                </Label>
                <Input
                  className="text-md bg-gray-700 text-white border border-gray-600 focus:ring-cyan-500"
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  disabled={status !== "idle"}
                />
              </div>

              {error && (
                <Alert
                  variant="destructive"
                  className="bg-red-800 text-white border-red-600"
                >
                  <AlertTitle className="font-bold">Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleDeploy}
                disabled={status !== "idle"}
                className={`w-full text-lg ${
                  status === "uploading"
                    ? "bg-yellow-500 text-gray-900"
                    : status === "deploying"
                    ? "bg-yellow-500 text-gray-900"
                    : // : status == "deployed"
                      // ? "bg-[#59D966] text-black"
                      "bg-[#1D4ED8] hover:bg-blue-600 text-white"
                }`}
                type="submit"
              >
                {status === "uploading" && (
                  <>
                    Uploading
                    <LoadingDots />
                  </>
                )}
                {status === "deploying" && (
                  <>
                    Deploying
                    <LoadingDots />
                  </>
                )}

                {status === "idle" && "Deploy"}
                {status === "failed" && "Failed"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {uploadId && (
        <Card
          className={`w-full max-w-2xl mt-8 ${
            status === "deployed"
              ? "bg-[#1da942]"
              : status === "failed"
              ? "bg-red-700"
              : "bg-yellow-500"
          } shadow-md`}
        >
          <CardHeader>
            <CardTitle className="text-4xl text-center font-bold text-black">
              {status === "deployed"
                ? "Deployment Complete"
                : status === "failed"
                ? "Deployment Failed"
                : "Deployment in Progress"}
            </CardTitle>
            <CardDescription className="text-xl text-center text-white font-bold">
              {status === "deployed"
                ? "Your website is successfully deployed!"
                : status === "failed"
                ? "Deployment encountered an error."
                : "Deploying your repository..."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 && (
              <div className="p-4 bg-gray-900 rounded-md max-h-80 overflow-y-auto">
                <h2 className="text-lg font-semibold mb-2 text-gray-300">
                  Deployment Logs:
                </h2>
                <ul className="text-sm font-mono">
                  {logs.map((log, index) => {
                    const sanitizedLog = sanitizeLogs(log.entry);
                    const isStdout = sanitizedLog.startsWith("stdout:");
                    const isStderr = sanitizedLog.startsWith("stderr:");

                    return (
                      <li key={index} className="mb-1">
                        <span className="text-cyan-400 font-bold">
                          {log.timestamp || "No Timestamp"}
                        </span>{" "}
                        <span
                          className={`${
                            isStdout
                              ? "text-green-500 font-bold"
                              : isStderr
                              ? "text-red-500 font-bold"
                              : "text-gray-400"
                          }`}
                        >
                          {isStdout
                            ? "stdout"
                            : isStderr
                            ? "stderr"
                            : "unknown"}
                          :
                        </span>{" "}
                        <span className="italic text-gray-100">
                          {sanitizedLog.replace(/^(stdout|stderr):\s*/, "")}
                        </span>
                        {status === "deploying" &&
                          index === logs.length - 1 && <LoadingDots />}
                        <div className="text-gray-600 text-xs">---</div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
