import Marketplace from "./chain-info/contracts/Marketplace.json"
import networkMapping from "./chain-info/deployments/map.json"
import {Contract, providers, utils} from "ethers";

export const getDeployedContract = async () => {
    const {abi} = Marketplace
    const provider = new providers.Web3Provider(window.ethereum)
    const {chainId} = await provider.getNetwork()
    if (!chainId || !networkMapping[String(chainId)]) {
        return null
    }
    const contractAddress = networkMapping[String(chainId)]["Marketplace"][0]
    const contractInterface = new utils.Interface(abi)
    const contract = new Contract(contractAddress, contractInterface, provider.getSigner())
    return await contract.deployed()
}

export const getAllProducts = async (contract) => {
    const products = []
    const count = await contract.productCount()
    for (let i = 1; i <= count; i++) {
        const {id, name, price, owner, purchased} = await contract.products(i)
        products.push({
            id: +utils.formatUnits(id, 0),
            name,
            price: utils.formatEther(price),
            owner,
            purchased
        })
    }
    return products
}
