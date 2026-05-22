// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SimpleVoting {
    struct Candidate {
        string name;
        uint256 voteCount;
        bool exists;
    }

    address public owner;
    uint256 public votingDeadline;
    uint256 public minimumQuorum;
    uint256 public totalVotes;

    Candidate[] private candidates;
    mapping(address => bool) public hasVoted;
    mapping(address => uint256) public votingPower;

    event CandidateCreated(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 weight);
    event VotingPowerChanged(address indexed voter, uint256 oldPower, uint256 newPower);
    event VotingDeadlineExtended(uint256 oldDeadline, uint256 newDeadline);
    event MinimumQuorumChanged(uint256 oldQuorum, uint256 newQuorum);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier votingOpen() {
        require(block.timestamp < votingDeadline, "Voting period has ended");
        _;
    }

    constructor(uint256 _durationInSeconds, uint256 _minimumQuorum) {
        require(_durationInSeconds > 0, "Duration must be greater than zero");

        owner = msg.sender;
        votingDeadline = block.timestamp + _durationInSeconds;
        minimumQuorum = _minimumQuorum;
    }

    function addCandidate(string calldata _name) external onlyOwner votingOpen {
        require(bytes(_name).length > 0, "Candidate name cannot be empty");

        candidates.push(Candidate({name: _name, voteCount: 0, exists: true}));
        emit CandidateCreated(candidates.length - 1, _name);
    }

    function vote(uint256 _candidateId) external votingOpen {
        require(!hasVoted[msg.sender], "Address has already voted");
        require(_candidateId < candidates.length && candidates[_candidateId].exists, "Invalid candidate");

        uint256 weight = votingPower[msg.sender];
        if (weight == 0) {
            weight = 1;
        }

        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount += weight;
        totalVotes += weight;

        emit VoteCast(msg.sender, _candidateId, weight);
    }

    function setVotingPower(address _voter, uint256 _power) external onlyOwner {
        require(_voter != address(0), "Invalid voter address");

        uint256 oldPower = votingPower[_voter];
        votingPower[_voter] = _power;

        emit VotingPowerChanged(_voter, oldPower, _power);
    }

    function extendVotingDeadline(uint256 _additionalSeconds) external onlyOwner votingOpen {
        require(_additionalSeconds > 0, "Additional time must be greater than zero");

        uint256 oldDeadline = votingDeadline;
        votingDeadline += _additionalSeconds;

        emit VotingDeadlineExtended(oldDeadline, votingDeadline);
    }

    function setMinimumQuorum(uint256 _minimumQuorum) external onlyOwner {
        uint256 oldQuorum = minimumQuorum;
        minimumQuorum = _minimumQuorum;

        emit MinimumQuorumChanged(oldQuorum, _minimumQuorum);
    }

    function getCandidate(uint256 _candidateId) external view returns (string memory name, uint256 voteCount) {
        require(_candidateId < candidates.length && candidates[_candidateId].exists, "Invalid candidate");

        Candidate storage candidate = candidates[_candidateId];
        return (candidate.name, candidate.voteCount);
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getWinner() external view returns (uint256 winnerId, string memory winnerName, uint256 winnerVoteCount) {
        require(block.timestamp >= votingDeadline, "Voting is still open");
        require(candidates.length > 0, "No candidates available");
        require(totalVotes >= minimumQuorum, "Minimum quorum not reached");

        uint256 winningVoteCount = candidates[0].voteCount;
        uint256 winningCandidateId = 0;

        for (uint256 i = 1; i < candidates.length; i++) {
            if (candidates[i].voteCount > winningVoteCount) {
                winningVoteCount = candidates[i].voteCount;
                winningCandidateId = i;
            }
        }

        Candidate storage winner = candidates[winningCandidateId];
        return (winningCandidateId, winner.name, winner.voteCount);
    }

    function isQuorumReached() external view returns (bool) {
        return totalVotes >= minimumQuorum;
    }
}
