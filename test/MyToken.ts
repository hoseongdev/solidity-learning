import hre from "hardhat";
import { expect } from "chai";

describe("My Token", () => {
  const mintingAmount = 100n;
  const decimals = 18;

  async function deployFixture() {
    const signers = await hre.ethers.getSigners();
    const MyToken = await hre.ethers.getContractFactory("MyToken");
    const myTokenC = await MyToken.deploy("MyToken", "MT", decimals, mintingAmount);
    return { myTokenC, signers };
  }

  describe("TransferFrom", () => {
    it("approve & transferFrom: signer1이 signer0의 토큰을 자신에게 전송 후 잔액 확인", async () => {
      const { myTokenC, signers } = await deployFixture();
      const signer0 = signers[0];
      const signer1 = signers[1];

      const transferAmount = hre.ethers.parseUnits("5", decimals);

      // signer0이 signer1에게 approve
      await myTokenC.connect(signer0).approve(signer1.address, transferAmount);

      // signer1이 signer0 -> signer1으로 transferFrom
      await myTokenC.connect(signer1).transferFrom(
        signer0.address,
        signer1.address,
        transferAmount
      );

      // signer1 잔액 확인
      expect(await myTokenC.balanceOf(signer1.address)).to.equal(transferAmount);
    });

    it("민팅량 초과 transferFrom 시 revert", async () => {
      const { myTokenC, signers } = await deployFixture();
      const signer0 = signers[0];
      const signer1 = signers[1];

      const overAmount = hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals);

      // 초과 금액 approve
      await myTokenC.connect(signer0).approve(signer1.address, overAmount);

      // transferFrom 시도 → insufficient allowance 아니라 balanceOf 부족으로 revert
      await expect(
        myTokenC.connect(signer1).transferFrom(
          signer0.address,
          signer1.address,
          overAmount
        )
      ).to.be.reverted;
    });
  });
});