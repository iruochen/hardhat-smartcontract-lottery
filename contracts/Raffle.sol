// Raffle
// Enter the lottery (paying some amount of ETH)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keepers)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {VRFConsumerBaseV2Plus} from '@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol';
import {VRFV2PlusClient} from '@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol';
import {AutomationCompatibleInterface} from '@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol';

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();
error Raffle__NotOpen();
error Raffle_UpKeepNotNeeded(
	uint256 currentBalance,
	uint256 numPlayers,
	uint256 raffleState
);

/**
 * @title A sample Raffle contract
 * @author ruochen
 * @notice This contract is for creating an untamperable decentralized smart contract lottery
 * @dev This implements Chainlink VRF v2.5 and Chainlink Automation
 */
contract Raffle is VRFConsumerBaseV2Plus, AutomationCompatibleInterface {
	/** Type declarations */
	enum RaffleState {
		OPEN,
		CALCULATING
	} // uint256 0 = OPEN, 1 = CALCULATING

	/** State Variables */
	// ETH required to enter the raffle
	uint256 private immutable i_entranceFee;
	// players in the raffle
	address payable[] private s_players;
	// The gas lane key hash value, which is the maximum gas price you are willing to pay for a request in wei.
	bytes32 private immutable i_gasLine;
	// The subscription ID that this contract uses for funding requests.
	uint256 private immutable i_subscriptionId;
	// The limit for how much gas to use for the callback request to your contract's fulfillRandomWords function.
	uint32 private immutable i_callbackGasLimit;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private constant NUM_WORDS = 1;

	// Lottery Variables
	// The address of the most recent winner
	address private s_recentWinner;
	RaffleState private s_raffleState;
	// The timestamp of the last time the raffle was drawn
	uint256 private s_lastTimeStamp;
	// The interval at which the raffle is drawn
	uint256 private immutable i_interval;

	/** Events */
	event RaffleEntered(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	/** Functions */
	constructor(
		address vrfCoordinator, // contract
		uint256 entranceFee,
		bytes32 gasLine,
		uint256 subscriptionId,
		uint32 callbackGasLimit,
		uint256 interval
	) VRFConsumerBaseV2Plus(vrfCoordinator) {
		i_entranceFee = entranceFee;
		i_gasLine = gasLine;
		i_subscriptionId = subscriptionId;
		i_callbackGasLimit = callbackGasLimit;
		s_raffleState = RaffleState.OPEN;
		s_lastTimeStamp = block.timestamp;
		i_interval = interval;
	}

	function enterRaffle() public payable {
		// require msg.value >= i_entranceFee, "Not enough ETH!");
		if (msg.value < i_entranceFee) {
			revert Raffle__NotEnoughETHEntered();
		}
		if (s_raffleState != RaffleState.OPEN) {
			revert Raffle__NotOpen();
		}
		s_players.push(payable(msg.sender));
		// Emit an event when we update a dynamic array or mapping
		// Named events with the function name reversed
		emit RaffleEntered(msg.sender);
	}

	/**
	 * @dev This is the function that the Chainlink Keeper nodes call
	 * they look for the `upkeepNeeded` to return true.
	 * the following should be true in order to return true:
	 * 1. Our time interval should have passed
	 * 2. The lottery should have at least 1 player and have some ETH
	 * 3. Our subscription is funded with LINK
	 * 4. The lottery should be in an "open" state
	 */
	function checkUpkeep(
		bytes memory /** checkData */
	)
		public
		view
		override
		returns (bool upkeepNeeded, bytes memory /* performData */)
	{
		bool isOpen = (RaffleState.OPEN == s_raffleState);
		bool timePassed = ((block.timestamp - s_lastTimeStamp) > i_interval);
		bool hasPlayers = (s_players.length > 0);
		bool hasBalance = (address(this).balance > 0);
		upkeepNeeded = (isOpen && timePassed && hasPlayers && hasBalance);
	}

	function performUpkeep(bytes calldata /* preformData */) external override {
		(bool upkeepNeeded, ) = checkUpkeep('');
		if (!upkeepNeeded) {
			revert Raffle_UpKeepNotNeeded(
				address(this).balance,
				s_players.length,
				uint256(s_raffleState)
			);
		}
		s_raffleState = RaffleState.CALCULATING;
		uint256 requestId = s_vrfCoordinator.requestRandomWords(
			VRFV2PlusClient.RandomWordsRequest({
				// gasLine
				keyHash: i_gasLine,
				subId: i_subscriptionId,
				requestConfirmations: REQUEST_CONFIRMATIONS,
				callbackGasLimit: i_callbackGasLimit,
				numWords: NUM_WORDS,
				extraArgs: VRFV2PlusClient._argsToBytes(
					VRFV2PlusClient.ExtraArgsV1({nativePayment: false})
				)
			})
		);
		emit RequestedRaffleWinner(requestId);
	}

	function fulfillRandomWords(
		uint256 /** requestId */,
		uint256[] calldata randomWords
	) internal override {
		uint256 indexOfWinner = randomWords[0] % s_players.length;
		address payable recentWinner = s_players[indexOfWinner];
		s_recentWinner = recentWinner;
		s_raffleState = RaffleState.OPEN;
		s_players = new address payable[](0); // reset the players array
		s_lastTimeStamp = block.timestamp;
		(bool success, ) = recentWinner.call{value: address(this).balance}('');
		if (!success) {
			revert Raffle__TransferFailed();
		}
		emit WinnerPicked(recentWinner);
	}

	/** View / Pure functions */
	function getEntranceFee() public view returns (uint256) {
		return i_entranceFee;
	}

	function getPlayers(uint256 index) public view returns (address) {
		return s_players[index];
	}

	function getRecentWinner() public view returns (address) {
		return s_recentWinner;
	}

	function getRaffleState() public view returns (RaffleState) {
		return s_raffleState;
	}

	function getNumWords() public pure returns (uint32) {
		return NUM_WORDS;
	}

	function getNumberOfPlayers() public view returns (uint256) {
		return s_players.length;
	}

	function getLatestTimeStamp() public view returns (uint256) {
		return s_lastTimeStamp;
	}

	function getRequestConfirmations() public pure returns (uint256) {
		return REQUEST_CONFIRMATIONS;
	}
}
