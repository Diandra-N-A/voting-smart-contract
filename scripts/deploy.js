const hre = require("hardhat");

async function main() {
  const durationInSeconds = 7 * 24 * 60 * 60;
  const minimumQuorum = 2;

  const SimpleVoting = await hre.ethers.getContractFactory("SimpleVoting");
  const voting = await SimpleVoting.deploy(durationInSeconds, minimumQuorum);
  await voting.waitForDeployment();

  await voting.addCandidate("Alice");
  await voting.addCandidate("Bob");
  await voting.addCandidate("Charlie");

  const address = await voting.getAddress();
  console.log(`SimpleVoting deployed to: ${address}`);
  console.log(`Owner: ${await voting.owner()}`);
  console.log(`Candidate count: ${await voting.getCandidateCount()}`);
  console.log(`Minimum quorum: ${await voting.minimumQuorum()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
