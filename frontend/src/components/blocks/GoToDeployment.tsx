import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { ConfettiFireworks } from "../ui/ConfitteFirework";

interface GoToDeploymentProps {
  uploadId: string;
}

const GoToDeployment: React.FC<GoToDeploymentProps> = ({ uploadId }) => {
  useEffect(() => {
    ConfettiFireworks();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  const [copied, setCopied] = useState(false);

  const deploymentUrl = `https://${uploadId}.deployed.prathamalu.xyz`;

  return (
    <div className="p-6 bg-[#181073] rounded-lg text-white mt-4">
      <h2 className="text-2xl font-bold mb-3 text-cyan-400">
        🎉 Your project is deployed successfully!
      </h2>
      <p className="text-lg mb-3 text-white">You can visit it at:</p>
      <div className="flex items-center bg-[#2D3748] p-2 rounded border border-gray-600">
        <a
          href={deploymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#99C3EA] underline font-mono text-lg flex-1 truncate hover:text-cyan-400 "
        >
          {deploymentUrl}
        </a>
        <CopyToClipboard
          text={deploymentUrl}
          onCopy={() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
          }}
        >
          <button className="border border-gray-300 px-2 py-1 rounded-md hover:bg-[#1a2a46]">
            copy
          </button>
        </CopyToClipboard>
      </div>
      {copied && <p className="text-white text-xs mt-2">Copied</p>}
      <Button
        className="w-full bg-[#1D4ED8] border border-black hover:bg-cyan-700 mt-4 text-white px-2 py-1 rounded text-lg"
        onClick={() => window.open(deploymentUrl, "_blank")}
      >
        Visit
      </Button>
    </div>
  );
};

export default GoToDeployment;
