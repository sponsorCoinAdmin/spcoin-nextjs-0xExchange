'use client';
import styles from '../../../styles/Exchange.module.css';
import Image from 'next/image';
import spCoin_png from '../../../../public/resources/images/spCoin.png';
import info_png from '../../../../public/resources/images/info1.png';
import cog_png from '../../../../public/resources/images/miscellaneous/cog.png';
import {
  openDialog,
  AgentDialog,
  RecipientDialog,
  SellTokenDialog,
  BuyTokenDialog,
  ErrorDialog
} from '../../../components/Dialogs/Dialogs';
import { Input, Popover, Radio } from "antd";
import ApproveOrReviewButton from '../../../components/Buttons/ApproveOrReviewButton';
import CustomConnectButton from '../../../components/Buttons/CustomConnectButton';
import useSWR from "swr";
import { useState, useEffect, SetStateAction } from "react";
import { formatUnits, parseUnits } from "ethers";
import { useBalance, useChainId, type Address } from "wagmi";
import { watchAccount, watchNetwork } from "@wagmi/core";
import { fetchStringBalance } from '../../../lib/wagmi/fetchBalance';
import { ArrowDownOutlined, DownOutlined, SettingOutlined } from "@ant-design/icons";
import { getDefaultNetworkSettings } from '../../../lib/network/initialize/defaultNetworkSettings';
import { TokenElement, WalletElement } from '../../../lib/structure/types';
import { getNetworkName } from '@/app/lib/network/utils';
import { fetcher, processError } from '@/app/lib/0X/fetcher';
import { validatePrice, setRateRatios} from '@/app/lib/spCoin/utils';
import type { PriceResponse } from "../../../api/types";

import {
  hideElement,
  showElement,
  hideSponsorRecipientConfig,
  showSponsorRecipientConfig,
  toggleElement,
  switchTokens
} from '@/app/lib/spCoin/guiControl';
const AFFILIATE_FEE:any = process.env.NEXT_PUBLIC_AFFILIATE_FEE === undefined ? "0" : process.env.NEXT_PUBLIC_AFFILIATE_FEE

import { rateInfo } from '../../../resources/docs/stakingFormula'

//////////// Price Code
export default function PriceView({
  connectedWalletAddr, price, setPrice, setFinalize,
}: {
  connectedWalletAddr: Address | undefined;
  price: PriceResponse | undefined;
  setPrice: (price: PriceResponse | undefined) => void;
  setFinalize: (finalize: boolean) => void;
}) {

// From New Not Working
const [network, setNetwork] = useState("ethereum");
  // const [network, setNetwork] = useState(networkName?.toLowerCase());
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [sellBalance, setSellBalance] = useState("0");
  const [buyBalance, setBuyBalance] = useState("0");
  const [tradeDirection, setTradeDirection] = useState("sell");

// Start From New Not Working
  const defaultNetworkSettings = getDefaultNetworkSettings('ethereum')
  const [sellTokenElement, setSellTokenElement] = useState<TokenElement>(defaultNetworkSettings?.defaultSellToken);
  const [buyTokenElement, setBuyTokenElement] = useState<TokenElement>(defaultNetworkSettings?.defaultBuyToken);
  const [recipientElement, setRecipientElement] = useState(defaultNetworkSettings?.defaultRecipient);
  const [agentElement, setAgentElement] = useState(defaultNetworkSettings?.defaultAgent);
  const [errorMessage, setErrorMessage] = useState<Error>({ name: "", message: "" });
// End From New Not Working

  useEffect(() => {
    hideSponsorRecipientConfig();
  },[]);

  useEffect(() => {
    updateBuyBalance(buyTokenElement);
    updateSellBalance(sellTokenElement);
  }, [connectedWalletAddr]);

  useEffect(() => {
    console.debug("sellTokenElement.symbol changed to " + sellTokenElement.name);
    updateSellBalance(sellTokenElement);
  }, [sellTokenElement]);

  useEffect(() => {
    console.debug("buyTokenElement.symbol changed to " + buyTokenElement.name);
    updateBuyBalance(buyTokenElement);
  }, [buyTokenElement]);

  useEffect(() => {
    // alert("Opening up errorMessage Dialog errorMessage = "+JSON.stringify(errorMessage,null,2))
    if (errorMessage.name !== "" && errorMessage.message !== "") {
      // alert("useEffect(() => errorMessage.name = " + errorMessage.name + "\nuseEffect(() => errorMessage.message = " + errorMessage.message)
      // alert('openDialog("#errorDialog")')
      openDialog("#errorDialog");
    }
  }, [errorMessage]);

  useEffect(() => { {
    if (buyTokenElement.symbol === "SpCoin") {
      showElement("addSponsorship")
    }
    else {
      hideElement("addSponsorship")
      hideElement("recipientSelectDiv")
      hideElement("recipientConfigDiv")
      hideElement("agent");
      }
    }
  }, [buyTokenElement]);

  useEffect(() => { {
    if (sellTokenElement.symbol === "SpCoin") {
      showElement("sponsoredBalance")
    }
    else {
      hideElement("sponsoredBalance")
      }
    }
  }, [sellTokenElement]);

  useEffect(() => {
    updateNetwork(network)
  }, [network]);

  const updateNetwork = (network:string | number) => {
    // alert("Price:network set to " + network)
    console.debug("Price:network set to " + network);
    let networkSettings = getDefaultNetworkSettings(network);
    setSellTokenElement(networkSettings?.defaultSellToken);
    setBuyTokenElement(networkSettings?.defaultBuyToken);
    setRecipientElement(networkSettings?.defaultRecipient);
    setAgentElement(networkSettings?.defaultAgent);
    console.debug(`Price:EXECUTING updateNetwork.updateBuyBalance(${buyTokenElement});`)
    console.debug(`Price:EXECUTING updateNetwork.updateSellBalance(${sellTokenElement});`)
    updateBuyBalance(buyTokenElement);
    updateSellBalance(sellTokenElement);
  }

  const unwatch = watchNetwork((network) => processNetworkChange(network));
  const unwatchAccount = watchAccount((account) => processAccountChange(account));

  const processAccountChange = (account: any) => {
    // console.debug("APP ACCOUNT = " + JSON.stringify(account.address, null, 2))
  };

  const processNetworkChange = (network: any) => {
    console.debug("Price:NETWORK NAME      = " + JSON.stringify(network?.chain?.name, null, 2));
    setNetwork(network?.chain?.name.toLowerCase());
  };

  const updateSellBalance = async (sellTokenElement: TokenElement) => {
    try {
      let tokenAddr = sellTokenElement.address;
      let chainId = sellTokenElement.chainId;
      // console.debug("updateSellBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
      // alert("updateSellBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
      if (connectedWalletAddr !== undefined)
      {
        let retResponse: any = await fetchStringBalance(connectedWalletAddr, tokenAddr, chainId);
        // console.debug("retResponse = " + JSON.stringify(retResponse))
        let sellResponse = validatePrice(retResponse.formatted, retResponse.decimals);
        setSellBalance(sellResponse);
      }
      else {
        setSellBalance("N/A");
      }
    } catch (e: any) {
      setErrorMessage({ name: "updateSellBalance: ", message: JSON.stringify(e, null, 2) });
    }
    return { sellBalance };
  };

  const updateBuyBalance = async (buyTokenElement: TokenElement) => {
    try {
      let tokenAddr = buyTokenElement.address;
      let chainId = buyTokenElement.chainId;
      // console.debug("updateBuyBalance(wallet Address = " + connectedWalletAddr + " Token Address = "+tokenAddr+ ", chainId = " + chainId +")");
      if (connectedWalletAddr !== undefined)
      {
        let retResponse: any = await fetchStringBalance(connectedWalletAddr, tokenAddr, chainId);
        // console.debug("retResponse = " + JSON.stringify(retResponse))
        setBuyBalance(retResponse.formatted);
      }
      else {
        setBuyBalance("N/A");
      }
    } catch (e: any) {
      setErrorMessage({ name: "updateBuyBalance: ", message: JSON.stringify(e, null, 2) });
    }
    return { buyBalance };
  };

  // This code currently only works for sell buy will default to undefined
  const parsedSellAmount = sellAmount && tradeDirection === "sell"
    ? parseUnits(sellAmount, sellTokenElement.decimals).toString()
    : undefined;

  const parsedBuyAmount = buyAmount && tradeDirection === "buy"
    ? parseUnits(buyAmount, buyTokenElement.decimals).toString()
    : undefined;

  const { isLoading: isLoadingPrice } = useSWR(
    [
      "/api/" + network + "/0X/price",
      {
        sellToken: sellTokenElement.address,
        buyToken: buyTokenElement.address,
        sellAmount: parsedSellAmount,
        buyAmount: parsedBuyAmount,
        connectedWalletAddr,
      },
    ],
    fetcher,
    {
      onSuccess: (data) => {
        setPrice(data);
        console.debug(formatUnits(data.buyAmount, buyTokenElement.decimals), data);
        setBuyAmount(formatUnits(data.buyAmount, buyTokenElement.decimals));
      },
      onError: (error) => {
        processError(
          error,
          setErrorMessage,
          buyTokenElement,
          sellTokenElement,
          setBuyAmount,
          setValidPriceInput
        );
      },
    }
  );

  const { data, isError, isLoading } = useBalance({
    address: connectedWalletAddr,
    token: sellTokenElement.address,
  });

  const disabled = data && sellAmount
    ? parseUnits(sellAmount, sellTokenElement.decimals) > data.value
    : true;

  //  console.debug("data = " + JSON.stringify(data, null, 2), "\nisError = " + isError, "isLoading = " + isLoading);
  // ------------------------------ START MORALIS SCRIPT CODE
  let [slippage, setSlippage] = useState(2.5);
  function handleSlippageChange(e: { target: { value: SetStateAction<number>; }; }) {
    setSlippage(e.target.value);
  }

  const settings = (
    <div>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={handleSlippageChange}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </div>
  );

  const setValidPriceInput = (txt: string, decimals: number) => {
    txt = validatePrice(txt, decimals);
    if (txt !== "")
      setSellAmount(txt);
  };

  const setCallBackRecipient = (listElement: any) => {
    showSponsorRecipientConfig();
    setRecipientElement(listElement)
  }

  // console.debug("Price:connectedWalletAddr = " + connectedWalletAddr)

  return (
    <form autoComplete="off">
      <SellTokenDialog connectedWalletAddr={connectedWalletAddr} buyTokenElement={buyTokenElement} callBackSetter={setSellTokenElement} />
      <BuyTokenDialog connectedWalletAddr={connectedWalletAddr} sellTokenElement={sellTokenElement} callBackSetter={setBuyTokenElement} />
      <RecipientDialog agentElement={agentElement} callBackSetter={setCallBackRecipient} />
      <AgentDialog recipientElement={recipientElement} callBackSetter={setAgentElement} />
      <ErrorDialog errMsg={errorMessage} />

      <div className={styles.tradeContainer}>
        <div className={styles.tradeContainerHeader}>
          <Image src={spCoin_png} className={styles.avatarImg} width={30} height={30} alt="Moralis Logo" />
          <h4 className={styles.center}>Sponsor Coin Exchange</h4>
          <Popover content={settings} title="Settings" trigger="click" placement="bottomLeft">
            <SettingOutlined className={styles.cog} />
          </Popover>
        </div>

        {/* Sell Token Selection Module */}
        <div className={styles.inputs}>
          <Input id="sell-amount-id" className={styles.priceInput} placeholder="0" disabled={false} value={sellAmount}
            onChange={(e) => { setValidPriceInput(e.target.value, sellTokenElement.decimals); }} />
          <div className={styles["assetSelect"]}>
            <img alt={sellTokenElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={sellTokenElement.img} onClick={() => alert("sellTokenElement " + JSON.stringify(sellTokenElement,null,2))}/>
            {sellTokenElement.symbol}
            <DownOutlined onClick={() => openDialog("#sellTokenDialog")}/>
          </div>
          <div className={styles["buySell"]}>
            You Pay
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {sellBalance}
          </div>
          <div id="sponsoredBalance" className={styles["sponsoredBalance"]}>
            Sponsored Balance: {"{ToDo}"}
          </div>
        </div>

        {/* Buy Token Selection Module */}
        <div className={styles.inputs}>
          <Input id="buy-amount-id" className={styles.priceInput} placeholder="0" disabled={true} value={parseFloat(buyAmount).toFixed(6)} />
          <div className={styles["assetSelect"]}>
            <img alt={buyTokenElement.name} className="h-9 w-9 mr-2 rounded-md cursor-pointer" src={buyTokenElement.img} onClick={() => alert("buyTokenElement " + JSON.stringify(buyTokenElement,null,2))}/>
            {buyTokenElement.symbol}
            <DownOutlined onClick={() => openDialog("#buyTokenDialog")}/>
          </div>
          <div className={styles["buySell"]}>
            You receive
          </div>
          <div className={styles["assetBalance"]}>
            Balance: {buyBalance}
          </div>

         <div id="addSponsorship" className={styles["addSponsorship"]} onClick={() => showSponsorRecipientConfig()}>
            <div className={styles["centerContainer"]} >Add Sponsorship</div>
          </div>
      </div>

        {/* Buy/Sell Arrow switch button */}
        <div className={styles.switchButton}>
          <ArrowDownOutlined className={styles.switchArrow} onClick={() => switchTokens(
            sellTokenElement, buyTokenElement, setSellTokenElement, setBuyTokenElement)}/>
        </div>

        {/* Connect Approve or Review Buttons */}
        {connectedWalletAddr ?
          (<ApproveOrReviewButton token={sellTokenElement}
            connectedWalletAddr={connectedWalletAddr}
            sellBalance={sellBalance}
            onClick={() => { setFinalize(true); }}
            disabled={disabled}
            setErrorMessage={setErrorMessage} />) :
          (<CustomConnectButton />)}

        {/* Your Sponsorship/Recipient selection container */}
        <div id="recipientSelectDiv" className={styles["inputs"]}>
          <div id="recipient-id" className={styles.sponsorCoinContainer}/>
          <div className={styles["yourRecipient"]}>
            You are sponsoring:
          </div>
          <div className={styles["recipientName"]}>
            {recipientElement.name}
          </div>
          <div className={styles["recipientSelect"]}>
            <img alt={recipientElement.name} className="h-9 w-9 mr-2 rounded-md" src={recipientElement.img} />
            {recipientElement.symbol}
            <DownOutlined onClick={() => openDialog("#recipientDialog")}/>
          </div>
          <div>
            <Image src={cog_png} className={styles["cogImg"]} width={20} height={20} alt="Info Image"  onClick={() => toggleElement("recipientConfigDiv")}/>
          </div>
          <div id="closeSponsorSelect" className={styles["closeSponsorSelect"]} onClick={() => hideSponsorRecipientConfig()}>
            X
          </div>
        </div>

        {/* Your Sponsorship/Recipient configuration container */}
        <div id="recipientConfigDiv" className={styles.rateRatioContainer}>
          <div className={styles["inputs"]}>
            <div id="recipient-config" className={styles.rateRatioContainer2}/>
            <div className={styles["lineDivider"]}>
            -------------------------------------------------------
            </div>
            <div className={styles["rewardRatio"]}>
              Staking Reward Ratio:
            </div>
            <Image src={info_png} className={styles["infoImg"]} width={18} height={18} alt="Info Image" onClick={() => alert(rateInfo)}/>
            <div className={styles["assetSelect"] + " " + styles["sponsorRatio"]}>
              Sponsor:
              <div id="sponsorRatio">
                50%
              </div>
            </div>
            <div id="closeSponsorConfig" className={styles["closeSponsorConfig"]} onClick={() => hideElement("recipientConfigDiv")}>
              X
            </div>
            <div className={styles["assetSelect"] + " " + styles["recipientRatio"]}>
              Recipient:
              <div id="recipientRatio">
                50%
              </div>
            </div>
            <input type="range" className={styles["range-slider"]} min="2" max="10" 
            onChange={(e) => setRateRatios((e.target.value))}></input>
          {/* <div id="agentRateFee" className={styles["agentRateFee"]}>
            Fee Disclosures
            <Image src={info_png} className={styles["feeInfoImg"]} width={18} height={18} alt="Info Image" />
          </div> */}
          </div>
        </div>

        {/* Affiliate fee display container */}
        <div className="text-slate-400">
          {price && price.grossBuyAmount
            ? "Affiliate Fee: " +
            Number(formatUnits(BigInt(price.grossBuyAmount), buyTokenElement.decimals)) *
            AFFILIATE_FEE + " " + buyTokenElement.symbol
            : null}
        </div>

      </div>
      {isLoadingPrice && (
        <div className="text-center mt-2">Fetching the best price...</div>
      )}
    </form>
  );
}
