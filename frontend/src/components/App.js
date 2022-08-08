import {useEffect, useState} from "react";
import {providers, utils} from "ethers";
import {useEthers} from "@usedapp/core";
import {getAllProducts, getDeployedContract} from "../contractUtils";
import {CircularProgress} from "@mui/material";

function App() {
    const [contract, setContract] = useState(null)
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(false)

    const {account, activateBrowserWallet, deactivate, chainId} = useEthers()

    const isConnected = account !== undefined

    useEffect(() => {
        const provider = new providers.Web3Provider(window.ethereum, "any")
        provider.on("network", (newNetwork, oldNetwork) => {
            // When a Provider makes its initial connection, it emits a "network"
            // event with a null oldNetwork along with the newNetwork. So, if the
            // oldNetwork exists, it represents a changing network
            if (oldNetwork) {
                window.location.reload()
            }
        })
    }, [])

    useEffect(() => {
        if (!account || contract)
            return
        const run = async () => {
            setLoading(true)
            const contract = await getDeployedContract()
            if (contract) {
                setContract(contract)
                refresh(contract)
            } else {
                window.alert('Please connect to Rinkeby Test Network')
            }
        }
        run()
    }, [account, chainId])

    const refresh = async (contract) => {
        setLoading(true)
        const products = await getAllProducts(contract)
        setProducts(products)
        setLoading(false)
    }

    const addProduct = async (e) => {
        e.preventDefault()
        const priceInWei = utils.parseEther(price)
        setLoading(true)
        setName("")
        setPrice("")
        try {
            const tx = await contract.createProduct(name, priceInWei)
            await tx.wait(1)
            await refresh(contract)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    const buyProduct = async (id, price) => {
        const priceInWei = utils.parseEther(price)
        setLoading(true)
        try {
            const tx = await contract.purchaseProduct(id, {value: priceInWei, gasLimit: 50000})
            await tx.wait(1)
            await refresh(contract)
        } catch (e) {
            console.error(e)
        }
        setLoading(false)
    }

    return (
        <div className="container mt-3">
            {
                loading
                    ? <div style={{height: "100vh", display: "flex", justifyContent: "center", alignItems: "center"}}>
                        <CircularProgress size={80}/>
                    </div>
                    : <div>
                        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center"}}>
                            <h2>Ethereum Marketplace</h2>
                            {
                                isConnected
                                    ? <button
                                        className="btn btn-secondary"
                                        style={{height: 38}}
                                        onClick={deactivate}>
                                        Disconnect
                                    </button>
                                    : ""
                            }
                        </div>
                        <hr/>
                        {isConnected
                            ? <div>
                                <h4>Add Product</h4>
                                <form style={{width: "50%"}} onSubmit={addProduct}>
                                    <input type="text" className="form-control mb-3" placeholder={"Product name"}
                                           value={name} onChange={e => setName(e.target.value)} required/>
                                    <input type="number" className="form-control mb-3" placeholder={"Product price"}
                                           value={price} onChange={e => setPrice(e.target.value)} required/>
                                    <button type="submit" className="btn btn-primary">Add Product
                                    </button>
                                </form>
                                <br/><br/>
                                <h4>Buy Product</h4>
                                <table className="table" style={{width: "60%"}}>
                                    <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Name</th>
                                        <th>Price</th>
                                        <th>Owner</th>
                                        <th></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {products.map((product, key) =>
                                        <tr key={key}>
                                            <th style={{verticalAlign: "middle"}}>{product.id.toString()}</th>
                                            <td style={{verticalAlign: "middle"}}>{product.name}</td>
                                            <td style={{verticalAlign: "middle"}}>{product.price} Eth</td>
                                            <td style={{verticalAlign: "middle"}}>{product.owner}</td>
                                            <td>
                                                {!product.purchased
                                                    ? <button
                                                        className="btn btn-primary"
                                                        onClick={() => buyProduct(product.id, product.price)}
                                                    >
                                                        Buy
                                                    </button>
                                                    : null
                                                }
                                            </td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            : <div>
                                <p style={{fontSize: 20}}>Connect to your Metamask wallet</p>
                                <button className="btn btn-primary" onClick={activateBrowserWallet}>Connect</button>
                            </div>
                        }
                    </div>
            }
        </div>
    );
}

export default App;
