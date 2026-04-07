import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PC City — Healthcare Communication Visualizer",
  description: "3D healthcare city showing message flows between hospital entities",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  var u="http://127.0.0.1:9999/log";
  function s(o){try{fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({url:location.href},o))}).catch(function(){});}catch(e){}}
  ["log","warn","error","info","debug"].forEach(function(l){
    var orig=console[l];
    console[l]=function(){
      s({level:l,msg:Array.from(arguments).map(function(a){try{return typeof a==="object"?JSON.stringify(a):String(a)}catch(e){return String(a)}}).join(" ")});
      orig.apply(console,arguments);
    };
  });
  window.onerror=function(msg,src,line,col,err){s({level:"error",msg:String(msg),source:src,line:line,stack:err&&err.stack});};
  window.addEventListener("unhandledrejection",function(e){s({level:"error",msg:"UnhandledRejection: "+e.reason,stack:e.reason&&e.reason.stack});});
  s({level:"info",msg:"console-log MCP connected"});
})();
        `}} />
        {children}
      </body>
    </html>
  );
}
