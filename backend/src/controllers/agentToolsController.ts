import { Request, Response } from "express";
import {
  createAgentPlan,
  findAgentCandidates,
  getRepositoryState,
  listAgents
} from "@/services/AgentToolsService";

export const getAgentToolStatus = (_req: Request, res: Response) => {
  res.json({
    success: true,
    repository: getRepositoryState()
  });
};

export const getAgentCatalog = (req: Request, res: Response) => {
  const query = typeof req.query.query === "string" ? req.query.query : "";
  const agents = query
    ? findAgentCandidates(query)
    : listAgents();

  res.json({
    success: true,
    agents,
    count: agents.length
  });
};

export const postAgentPlan = (req: Request, res: Response) => {
  const request = req.body?.request;

  if (typeof request !== "string" || !request.trim()) {
    res.status(400).json({
      success: false,
      message: '"request" must be a non-empty string.'
    });
    return;
  }

  res.json({
    success: true,
    plan: createAgentPlan(request)
  });
};
