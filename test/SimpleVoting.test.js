const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("SimpleVoting", function () {
  const ONE_DAY = 24 * 60 * 60;

  async function deploySimpleVotingFixture() {
    const [owner, voter1, voter2, voter3, outsider] = await ethers.getSigners();
    const SimpleVoting = await ethers.getContractFactory("SimpleVoting");
    const voting = await SimpleVoting.deploy(ONE_DAY, 2);

    await voting.addCandidate("Alice");
    await voting.addCandidate("Bob");

    return { voting, owner, voter1, voter2, voter3, outsider };
  }

  async function movePastDeadline(voting) {
    const deadline = await voting.votingDeadline();
    await network.provider.send("evm_setNextBlockTimestamp", [Number(deadline) + 1]);
    await network.provider.send("evm_mine");
  }

  describe("Deployment", function () {
    it("sets the deployer as owner", async function () {
      const { voting, owner } = await deploySimpleVotingFixture();

      expect(await voting.owner()).to.equal(owner.address);
    });

    it("initializes deadline, quorum, and candidates correctly", async function () {
      const { voting } = await deploySimpleVotingFixture();

      expect(await voting.minimumQuorum()).to.equal(2);
      expect(await voting.getCandidateCount()).to.equal(2);

      const deadline = await voting.votingDeadline();
      expect(deadline).to.be.gt(0);
    });

    it("rejects zero duration deployment", async function () {
      const SimpleVoting = await ethers.getContractFactory("SimpleVoting");

      await expect(SimpleVoting.deploy(0, 1)).to.be.revertedWith("Duration must be greater than zero");
    });
  });

  describe("Candidate Management", function () {
    it("allows owner to add a candidate and emits event", async function () {
      const { voting } = await deploySimpleVotingFixture();

      await expect(voting.addCandidate("Charlie"))
        .to.emit(voting, "CandidateCreated")
        .withArgs(2, "Charlie");

      expect(await voting.getCandidateCount()).to.equal(3);
      const candidate = await voting.getCandidate(2);
      expect(candidate.name).to.equal("Charlie");
    });

    it("rejects non-owner when adding candidate", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await expect(voting.connect(voter1).addCandidate("Charlie")).to.be.revertedWith(
        "Only owner can call this function"
      );
    });

    it("rejects empty candidate name", async function () {
      const { voting } = await deploySimpleVotingFixture();

      await expect(voting.addCandidate("")).to.be.revertedWith("Candidate name cannot be empty");
    });
  });

  describe("Voting", function () {
    it("allows a user to vote once and emits event", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await expect(voting.connect(voter1).vote(0))
        .to.emit(voting, "VoteCast")
        .withArgs(voter1.address, 0, 1);

      const candidate = await voting.getCandidate(0);
      expect(candidate.voteCount).to.equal(1);
      expect(await voting.hasVoted(voter1.address)).to.equal(true);
      expect(await voting.totalVotes()).to.equal(1);
    });

    it("rejects double voting from the same address", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await voting.connect(voter1).vote(0);

      await expect(voting.connect(voter1).vote(1)).to.be.revertedWith("Address has already voted");
    });

    it("rejects invalid candidate id", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await expect(voting.connect(voter1).vote(99)).to.be.revertedWith("Invalid candidate");
    });

    it("uses custom weighted voting power", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await expect(voting.setVotingPower(voter1.address, 3))
        .to.emit(voting, "VotingPowerChanged")
        .withArgs(voter1.address, 0, 3);

      await voting.connect(voter1).vote(1);

      const candidate = await voting.getCandidate(1);
      expect(candidate.voteCount).to.equal(3);
      expect(await voting.totalVotes()).to.equal(3);
    });
  });

  describe("Deadline and Quorum", function () {
    it("allows owner to extend deadline and update quorum", async function () {
      const { voting } = await deploySimpleVotingFixture();
      const oldDeadline = await voting.votingDeadline();

      await expect(voting.extendVotingDeadline(3600))
        .to.emit(voting, "VotingDeadlineExtended")
        .withArgs(oldDeadline, oldDeadline + 3600n);

      await expect(voting.setMinimumQuorum(5))
        .to.emit(voting, "MinimumQuorumChanged")
        .withArgs(2, 5);

      expect(await voting.minimumQuorum()).to.equal(5);
    });

    it("rejects voting after deadline", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();
      await movePastDeadline(voting);

      await expect(voting.connect(voter1).vote(0)).to.be.revertedWith("Voting period has ended");
    });

    it("rejects winner query before voting ends", async function () {
      const { voting } = await deploySimpleVotingFixture();

      await expect(voting.getWinner()).to.be.revertedWith("Voting is still open");
    });

    it("rejects winner query when quorum is not reached", async function () {
      const { voting, voter1 } = await deploySimpleVotingFixture();

      await voting.connect(voter1).vote(0);
      await movePastDeadline(voting);

      await expect(voting.getWinner()).to.be.revertedWith("Minimum quorum not reached");
    });

    it("returns winner after deadline when quorum is reached", async function () {
      const { voting, voter1, voter2, voter3 } = await deploySimpleVotingFixture();

      await voting.connect(voter1).vote(0);
      await voting.connect(voter2).vote(1);
      await voting.connect(voter3).vote(1);
      await movePastDeadline(voting);

      const winner = await voting.getWinner();
      expect(winner.winnerId).to.equal(1);
      expect(winner.winnerName).to.equal("Bob");
      expect(winner.winnerVoteCount).to.equal(2);
      expect(await voting.isQuorumReached()).to.equal(true);
    });
  });

  describe("Access Control", function () {
    it("rejects non-owner when setting voting power", async function () {
      const { voting, voter1, outsider } = await deploySimpleVotingFixture();

      await expect(voting.connect(outsider).setVotingPower(voter1.address, 2)).to.be.revertedWith(
        "Only owner can call this function"
      );
    });

    it("rejects zero address for voting power", async function () {
      const { voting } = await deploySimpleVotingFixture();

      await expect(voting.setVotingPower(ethers.ZeroAddress, 2)).to.be.revertedWith("Invalid voter address");
    });
  });
});
