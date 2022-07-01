//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

//all the imports for upgradeable contract
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract Staking is Initializable, OwnableUpgradeable, UUPSUpgradeable {

//using libraries for the different data types
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;
    //defining the end of the staking period
    uint public stakingPeriod;
    // Total amount of tokens in stkaing contract
    uint public totalStakedInPool;
    //defining the total staked in the staking pool
    EnumerableSet.AddressSet private userList;
    /// defining upgradeable Perks Contract
    IERC20Upgradeable public perkToken;
    //defining upgradeable MyToken contract
    IERC20Upgradeable public myToken;
    //defining the chainlink aggregator
    AggregatorV3Interface public chainlinkAggregatorAddress; // 0x2bA49Aaa16E6afD2a993473cfB70Fa8559B523cF - rinkeby
    //Storing the UserInfo and it's attributes
    struct UserInfo {
        uint amountStaked;
        uint stakingDuration;
        uint bonusTokens;
        uint bonusUnstake;
    }
    // storage of user information struct
    mapping(address => UserInfo) public userInfo;
    // storage of user information struct
    mapping(uint => uint) public AprRate;
    // storage of user information struct
    mapping(uint => uint) public bonusAprRate;


    //initialising the contract and it's functiom
    function initialize (
        IERC20Upgradeable perkCont,
        IERC20Upgradeable myTokenCont,
        AggregatorV3Interface _chainlinkAggregatorAddress,
        uint _stakingPeriod
    ) external initializer {
        perkToken = perkCont;
        myToken = myTokenCont;
        chainlinkAggregatorAddress = _chainlinkAggregatorAddress;
        stakingPeriod = _stakingPeriod;
        __Ownable_init();
        __UUPSUpgradeable_init();
         myTokenApr();
        PerkTokenApr();
    }

// To authorize the owner to upgrade the contract 
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

   //depositing myTokens in the pool.
    function depositInPool (uint _amount) external {
        UserInfo storage user = userInfo[msg.sender];
        require(_amount > 0, "depositStableCoin:: amount should be greater than zero");

        user.stakingDuration = block.timestamp;

        IERC20Upgradeable(myToken).transferFrom(msg.sender, address(this), _amount);

        updateUser();
        
        user.amountStaked = user.amountStaked.add(_amount);

        totalStakedInPool = totalStakedInPool.add(_amount);

        if(!userList.contains(msg.sender)) {
            userList.add(msg.sender);
        }
    }

   //unstaking the myToken along with rewards
    function unstake(uint _amount) external {
        UserInfo storage user = userInfo[msg.sender];
        require(_amount <= user.amountStaked, "unstake:: can not withdraw more than your staked amount");

        updateUser();

        IERC20Upgradeable(myToken).transfer(msg.sender, _amount);

        user.amountStaked = user.amountStaked.sub(_amount);

        totalStakedInPool = totalStakedInPool.sub(_amount);

        if(userList.contains(msg.sender)) {
            userList.remove(msg.sender);
        }
    }
    function myTokenApr() internal {
        AprRate[0] = 500;
        AprRate[1] = 1000;
        AprRate[2] = 1500;
    }

    function PerkTokenApr() internal {
        bonusAprRate[0] = 200;
        bonusAprRate[1] = 500;
        bonusAprRate[2] = 1000;
    }

    //withdraw reward tokens earned and for updating user profile
    function claimMyToken() external {
        updateUser();
    }

    //fetch total rewards earned by user and address of whom you want to check rewards for
    function remainingRewardAmount(address _userAddress) external view returns(uint) {
        uint pendingAmount = remainingReward(_userAddress);
        return pendingAmount; 
    }

    //update user information and transfer pending reward tokens
    function updateUser() internal {
        UserInfo storage user = userInfo[msg.sender];
        uint pendingReward = remainingReward(msg.sender);
        if (pendingReward > 0) {
            IERC20Upgradeable(perkToken).transfer(msg.sender, pendingReward);
            user.bonusTokens = user.bonusTokens.add(pendingReward);
        }
        user.bonusUnstake = block.timestamp;
    }
    // fetch current price of stable-PerkToken/USD and convert mytokens into usd price
    function ConvertIntoCurrency() internal view returns(int) {
        (, int currentUSDPrice, , ,) = chainlinkAggregatorAddress.latestRoundData();
        return currentUSDPrice;
    }
    //get pending rewards generated by user and to know the pending amount
    function remainingReward(address _userAddress) internal view returns(uint) {
        UserInfo storage user = userInfo[msg.sender];
        if(!userList.contains(_userAddress)) {
            return 0;
        }

        if(user.amountStaked == 0) {
            return 0;
        }

        uint stakedTimeDifference = block.timestamp.sub(userInfo[msg.sender].bonusUnstake);
        uint stakedAmountByUser = user.amountStaked;
        uint stakedAmountInUSD = stakedAmountByUser.mul(uint256(ConvertIntoCurrency())).div(1e8);

        uint _rewardRate;

       if(block.timestamp <= user.stakingDuration.add(30 minutes)) {
            _rewardRate = AprRate[0];
        }
        else if(block.timestamp > user.stakingDuration.add(30 minutes) && block.timestamp <= user.stakingDuration.add(180 minutes)) {
            _rewardRate = AprRate[1];
        }
        else {
            _rewardRate = AprRate[2];
        }

        if(stakedAmountInUSD >= 100) {
            _rewardRate = _rewardRate.add(bonusAprRate[0]);
        }        
        else if(stakedAmountInUSD >= 500) {
            _rewardRate = _rewardRate.add(bonusAprRate[1]);
        }
        else if(stakedAmountInUSD >= 1000) {
            _rewardRate = _rewardRate.add(bonusAprRate[2]);
        }

        uint totalPendingReward = stakedAmountByUser.mul(_rewardRate).mul(stakedTimeDifference).div(stakingPeriod).div(1e4);
        return totalPendingReward;
    }


}