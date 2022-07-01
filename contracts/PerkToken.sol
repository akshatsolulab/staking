//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PerkToken is ERC20 {
    constructor() ERC20("PerkToken", "PERK") {
        _mint(msg.sender, 999999999999999999000000000000000000 ether);
    }
}