const hre = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS first. Example: $env:CONTRACT_ADDRESS='0x...'");
  }

  const [owner, voter1, voter2] = await hre.ethers.getSigners();
  const voting = await hre.ethers.getContractAt("SimpleVoting", contractAddress);

  console.log(`Connected to SimpleVoting at: ${contractAddress}`);
  console.log(`Owner from contract: ${await voting.owner()}`);

  const powerTx = await voting.connect(owner).setVotingPower(voter1.address, 2);
  await powerTx.wait();
  console.log(`Set ${voter1.address} voting power to 2`);

  const vote1Tx = await voting.connect(voter1).vote(0);
  await vote1Tx.wait();
  console.log(`${voter1.address} voted for candidate 0`);

  const vote2Tx = await voting.connect(voter2).vote(1);
  await vote2Tx.wait();
  console.log(`${voter2.address} voted for candidate 1`);

  const alice = await voting.getCandidate(0);
  const bob = await voting.getCandidate(1);
  console.log(`Alice votes: ${alice.voteCount}`);
  console.log(`Bob votes: ${bob.voteCount}`);
  console.log(`Total weighted votes: ${await voting.totalVotes()}`);
  console.log(`Quorum reached: ${await voting.isQuorumReached()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
