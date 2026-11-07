import {
  createAgentPlan,
  findAgentCandidates,
  getRepositoryState,
  listAgents
} from "../services/AgentToolsService";

const [requestedCommand, ...args] = process.argv.slice(2);
const jsonCommand = requestedCommand?.endsWith("-json") ?? false;
const command = jsonCommand
  ? requestedCommand.slice(0, -"-json".length)
  : requestedCommand;
const jsonOutput = jsonCommand || args.includes("--json");
const values = args.filter((arg) => arg !== "--json");

const printHelp = () => {
  console.log(`Agent support tools

Usage:
  npm run agent-tools -- status | status-json
  npm run agent-tools -- agents [search words...] | agents-json [search words...]
  npm run agent-tools -- plan <request> | plan-json <request>
`);
};

const printStatus = () => {
  const repository = getRepositoryState();

  if (jsonOutput) {
    console.log(JSON.stringify(repository, null, 2));
    return;
  }

  console.log(`Repository: ${repository.root}`);
  console.log(`Branch: ${repository.branch || "(detached HEAD)"}`);
  console.log(`Working tree: ${repository.clean ? "clean" : "has changes"}`);
  console.log("Status:");
  repository.status.forEach((line) => console.log(`  ${line}`));
  console.log("Worktrees:");
  repository.worktrees.forEach(({ path, branch, current }) =>
    console.log(`  ${current ? "* " : "  "}${path} (${branch || "detached HEAD"})`)
  );
};

const printAgents = () => {
  const query = values.join(" ");
  const agents = query
    ? findAgentCandidates(query)
    : listAgents();

  if (jsonOutput) {
    console.log(JSON.stringify(agents, null, 2));
    return;
  }

  agents.forEach((agent) => {
    const score = "score" in agent ? ` [score: ${agent.score}]` : "";
    console.log(`${agent.name}${score}\n  ${agent.description}\n  ${agent.file}`);
  });
  console.log(`Found ${agents.length} agent(s).`);
};

const printPlan = () => {
  const request = values.join(" ");
  const plan = createAgentPlan(request);

  if (jsonOutput) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  console.log(`Request: ${plan.request}`);
  console.log(`Repository: ${plan.repository.root}`);
  console.log(`Branch: ${plan.repository.branch || "(detached HEAD)"}`);
  console.log("Candidate agents:");

  if (plan.candidateAgents.length === 0) {
    console.log("  No matching candidates; select an agent manually.");
  }

  plan.candidateAgents.forEach((agent) =>
    console.log(
      `  ${agent.name} (${agent.score}) - ${agent.matchedCapabilities.join(", ") || agent.description}`
    )
  );
  console.log("Next steps:");
  plan.nextSteps.forEach((step, index) => console.log(`  ${index + 1}. ${step}`));
};

try {
  switch (command) {
    case "status":
      printStatus();
      break;
    case "agents":
      printAgents();
      break;
    case "plan":
      printPlan();
      break;
    case "help":
    case undefined:
      printHelp();
      break;
    default:
      throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
