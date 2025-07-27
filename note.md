# Note
## `deployments.get(...)` vs `ethers.getContract(...)` 对比

当你使用 `hardhat-deploy` 插件时，可以使用这两个方法获取合约信息。它们用途不同，适用于不同场景。

### 📌 方法对比表

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

### 🧪 实战示例

#### 使用 `deployments.get(...)` + `ethers.getContractAt(...)`

```js
const deployment = await deployments.get("VRFCoordinatorV2_5Mock");
const contract = await ethers.getContractAt("VRFCoordinatorV2_5Mock", deployment.address);
```

# Q&A
## ethers v5 与 v6 一些语法差异
### 部署脚本中获取 event 参数
- ethers6使用以下方法获取不到 event
```js
const transactionResponse =
	await vrfCoordinatorV2_5Mock.createSubscription()
const transactionReceipt = await transactionResponse.wait(1)
subscriptionId = transactionReceipt.events[0].args.subId
```
- 需要通过log获取
```js
subscriptionId = transactionReceipt.logs[0].args.subId
```
>参考: [Github Discussions](https://github.com/smartcontractkit/full-blockchain-solidity-course-js/discussions/5779#discussioncomment-6703606)

### callStatic 写法
- ethers v5写法
```js
const { upkeepNeeded } = await raffle.callStatic.checkUpkeep('0x')
```
- ethers v6写法
```js
const { upkeepNeeded } = await raffle.checkUpkeep.staticCall('0x')
```

### 获取账号余额
- v5
```js
await account.getBalance()
```
- v6
```js
await ethers.provider.getBalance(account)
```

### 获取合约实例
- v5
```js
let raffle
await deployments.fixture('all')
raffle = await deployments.get('Raffle')
// The address of raffle
raffle.address
```
- v6
```js
let raffle
await deployments.fixture('all')
const raffleDeployment = await deployments.get('Raffle')
raffle = await ethers.getContractAt(
	raffleDeployment.abi,
	raffleDeployment.address,
)
// The address of raffle
raffle.target
```