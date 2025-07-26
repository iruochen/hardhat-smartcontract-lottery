// Raffle
// Enter the lottery (paying some amount of ETH)
// Pick a random winner (verifiably random)
// Winner to be selected every X minutes -> completely automated
// Chainlink Oracle -> Randomness, Automated Execution (Chainlink Keepers)

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {VRFConsumerBaseV2Plus} from '@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol';
import {VRFV2PlusClient} from '@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol';

error Raffle__NotEnoughETHEntered();
error Raffle__TransferFailed();

contract Raffle is VRFConsumerBaseV2Plus {
	/** State Variables */
	uint256 private immutable i_entranceFee;
	address payable[] private s_players;
	bytes32 private immutable i_gasLine;
	uint256 private immutable i_subscriptionId;
	uint32 private immutable i_callbackGasLimit;
	uint16 private constant REQUEST_CONFIRMATIONS = 3;
	uint32 private constant NUM_WORDS = 1;

	// Lottery Variables
	address private s_recentWinner;

	/** Events */
	event RaffleEntered(address indexed player);
	event RequestedRaffleWinner(uint256 indexed requestId);
	event WinnerPicked(address indexed winner);

	constructor(
		address vrfCoordinator,
		uint256 entranceFee,
		bytes32 gasLine,
		uint256 subscriptionId,
		uint32 callbackGasLimit
	) VRFConsumerBaseV2Plus(vrfCoordinator) {
		i_entranceFee = entranceFee;
		i_gasLine = gasLine;
		i_subscriptionId = subscriptionId;
		i_callbackGasLimit = callbackGasLimit;
	}

	function enterRaffle() public payable {
		// require msg.value >= i_entranceFee, "Not enough ETH!");
		if (msg.value < i_entranceFee) {
			revert Raffle__NotEnoughETHEntered();
		}
		s_players.push(payable(msg.sender));
		// Emit an event when we update a dynamic array or mapping
		// Named events with the function name reversed
		emit RaffleEntered(msg.sender);
	}

	function requestRandomWinner() external {
		// Request the random number
		// Once we get it, do something with it
		// 2 transactions process
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
}
