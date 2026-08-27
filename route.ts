import {createMcpHandler} from "mcp-handler";
import {z} from "zod";
import {announcements,eod,intraday,marketSnapshot,marketWatch,payouts,quote,symbols} from "../../../lib/psx";
export const runtime="nodejs"; export const dynamic="force-dynamic";
const secret=process.env.MCP_SECRET?.trim();
function authorized(req:Request){if(!secret)return false;return req.headers.get("authorization")===`Bearer ${secret}`||req.headers.get("x-api-key")===secret}
const handler=createMcpHandler((server)=>{
 server.registerTool("get_quote",{title:"PSX Quote",description:"Current PSX quote for a symbol.",inputSchema:z.object({symbol:z.string().min(1).max(20)})},async({symbol})=>({content:[{type:"text",text:JSON.stringify(await quote(symbol),null,2)}]}));
 server.registerTool("get_market_snapshot",{title:"PSX Market Snapshot",description:"PSX breadth, top gainers, losers and volume.",inputSchema:z.object({limit:z.number().int().min(1).max(25).default(10)})},async({limit})=>({content:[{type:"text",text:JSON.stringify(await marketSnapshot(limit),null,2)}]}));
 server.registerTool("get_market_watch",{title:"PSX Market Watch",description:"PSX market-watch universe.",inputSchema:z.object({})},async()=>({content:[{type:"text",text:JSON.stringify(await marketWatch(),null,2)}]}));
 server.registerTool("get_symbols",{title:"PSX Symbols",description:"PSX symbol directory.",inputSchema:z.object({})},async()=>({content:[{type:"text",text:JSON.stringify(await symbols(),null,2)}]}));
 server.registerTool("get_eod_history",{title:"PSX EOD History",description:"Daily historical price and volume series.",inputSchema:z.object({symbol:z.string().min(1).max(20)})},async({symbol})=>({content:[{type:"text",text:JSON.stringify(await eod(symbol),null,2)}]}));
 server.registerTool("get_intraday",{title:"PSX Intraday",description:"Intraday series for a PSX symbol.",inputSchema:z.object({symbol:z.string().min(1).max(20)})},async({symbol})=>({content:[{type:"text",text:JSON.stringify(await intraday(symbol),null,2)}]}));
 server.registerTool("get_announcements",{title:"PSX Announcements",description:"Recent company announcements.",inputSchema:z.object({symbol:z.string().min(1).max(20).optional(),limit:z.number().int().min(1).max(50).default(10)})},async({symbol,limit})=>({content:[{type:"text",text:JSON.stringify(await announcements(symbol,limit),null,2)}]}));
 server.registerTool("get_payouts",{title:"PSX Payouts",description:"Recent dividend/payout records.",inputSchema:z.object({symbol:z.string().min(1).max(20).optional(),limit:z.number().int().min(1).max(50).default(10)})},async({symbol,limit})=>({content:[{type:"text",text:JSON.stringify(await payouts(symbol,limit),null,2)}]}));
},{serverInfo:{name:"PSX Trading Gateway",version:"1.0.0"}});
async function guarded(req:Request){if(!authorized(req))return new Response("Unauthorized",{status:401});return handler(req)}
export const GET=guarded;export const POST=guarded;export const DELETE=guarded;
