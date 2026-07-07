import hre from "hardhat";
import { expect } from "chai";

describe("MultiManager", () => {
  async function deployFixture() {
    const signers = await hre.ethers.getSigners();
    const [owner, manager0, manager1, manager2, hacker] = signers;

    const managers: [string, string, string] = [
      manager0.address,
      manager1.address,
      manager2.address,
    ];

    const myToken = await hre.ethers.deployContract("MyToken", [
      "MyToken", "MT", 18, 1000
    ]);

    const tinyBank = await hre.ethers.deployContract("TinyBank", [
      await myToken.getAddress(),
      managers,
    ]);

    return { myToken, tinyBank, owner, manager0, manager1, manager2, hacker };
  }

  describe("setRewardPerBlock", () => {
    it("manager가 아닌 주소로 confirm 시 revert", async () => {
      const { tinyBank, hacker } = await deployFixture();
      await expect(
        tinyBank.connect(hacker).confirm()
      ).to.be.revertedWith("You are not a manager");
    });

    it("모든 manager가 confirm하지 않은 상황에서 setRewardPerBlock revert", async () => {
      const { tinyBank, manager0, manager1 } = await deployFixture();
      const newReward = hre.ethers.parseUnits("10", 18);

      await tinyBank.connect(manager0).confirm();
      await tinyBank.connect(manager1).confirm();

      await expect(
        tinyBank.setRewardPerBlock(newReward)
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("모든 manager가 confirm하면 setRewardPerBlock 성공", async () => {
      const { tinyBank, manager0, manager1, manager2 } = await deployFixture();
      const newReward = hre.ethers.parseUnits("10", 18);

      await tinyBank.connect(manager0).confirm();
      await tinyBank.connect(manager1).confirm();
      await tinyBank.connect(manager2).confirm();

      await tinyBank.setRewardPerBlock(newReward);
      expect(await tinyBank.rewardPerBlock()).to.equal(newReward);
    });
  });
});