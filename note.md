# `deployments.get(...)` vs `ethers.getContract(...)` 对比

当你使用 `hardhat-deploy` 插件时，可以使用这两个方法获取合约信息。它们用途不同，适用于不同场景。

## 📌 方法对比表

| 项目                  | `deployments.get(...)`                             | `ethers.getContract(...)`                            |
|-----------------------|----------------------------------------------------|------------------------------------------------------|
| 来源                  | `hardhat-deploy`                                   | `hardhat-deploy` + `ethers`                         |
| 返回值类型            | 合约部署信息对象（含地址、ABI、部署 tx 等）       | `ethers.Contract` 实例，直接可调用合约函数          |
| 是否包含 ABI          | ✅ 是                                               | ✅ 是                                                 |
| 是否包含地址          | ✅ 是                                               | ✅ 是                                                 |
| 是否已连接 signer     | ❌ 否（需手动 attach）                              | ✅ 是（默认连接第一个 signer）                       |
| 是否能直接调用函数    | ❌ 否                                               | ✅ 是                                                 |
| 常见用途              | 获取部署元信息、构建合约实例                        | 调用合约方法、测试交互                               |
| 示例代码              | `await deployments.get("MyContract")`             | `await ethers.getContract("MyContract")`            |

---

## 🧪 实战示例

### 使用 `deployments.get(...)` + `ethers.getContractAt(...)`

```js
const deployment = await deployments.get("VRFCoordinatorV2_5Mock");
const contract = await ethers.getContractAt("VRFCoordinatorV2_5Mock", deployment.address);
