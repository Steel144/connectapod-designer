import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Search, Pencil, Upload, X, Loader2, Plus, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import AddWallModal from "@/components/catalogue/AddWallModal";
import EditWallModal from "@/components/catalogue/EditWallModal";

const WALL_GROUPS = [
  {
    key: "0.6-1.2m",
    label: "0.6m & 1.2m Module Walls",
    series: "WY000-030",
    walls: [
      { code: "W000/Y000", name: "600mm Standard Wall", width: 600, variants: ["Standard (W000/Y000)", "Left End (W000L/Y000L)", "Right End (W000R/Y000R)", "Deck (W000D/Y000D)"], description: "600mm plain wall panel" },
      { code: "W001/Y001", name: "1200mm Standard Wall", width: 1200, variants: ["Standard (W001/Y001)", "Left End (W001R/Y001L)", "Right End (W001L/Y001R)", "Deck (W001D/Y001D)"], description: "1200mm plain wall panel" },
      { code: "WS003/YS003 (W66A1S)", name: "1200mm Wall – 1 Window (620×1520)", width: 1200, variants: ["Standard (WS003/YS003)", "Deck (W002D/Y002D)"], description: "620mm window, 275mm side frames, 1520mm height" },
      { code: "W004/Y004 (W69A1S)", name: "1200mm Wall – Window 690×1520", width: 1200, variants: ["Standard (W004/Y004)"], description: "690mm awning/window, 290mm frames" },
      { code: "W005/Y005 (W612A2S)", name: "1200mm Wall – 2 Windows (620×1220)", width: 1200, variants: ["Standard (W005/Y005)"], description: "Double window 620mm, height 1220mm" },
      { code: "W006/Y006 (W615A2S)", name: "1200mm Wall – 2 Windows (620×1520)", width: 1200, variants: ["Standard (W006/Y006)"], description: "Double window 620mm, height 1520mm" },
      { code: "W007/Y007 (W615F1)", name: "1200mm Wall – Fixed Window 615", width: 1200, variants: ["Standard (W007/Y007)"], description: "Fixed light window 620×1520mm" },
      { code: "W008/Y008 (W612F1)", name: "1200mm Wall – Fixed Window 612", width: 1200, variants: ["Standard (W008/Y008)"], description: "Fixed light window 620×1220mm" },
      { code: "W009/Y009 (W618A2S)", name: "1200mm Wall – 2 Windows 618", width: 1200, variants: ["Standard (W009/Y009)"], description: "Double window 620×1820mm" },
      { code: "W010/Y010 (W618F1S)", name: "1200mm Wall – Fixed 618", width: 1200, variants: ["Standard (W010/Y010)"], description: "Fixed window 620×2140mm" },
      { code: "W011/Y011 (W622A3S)", name: "1200mm Wall – 3 Windows 622", width: 1200, variants: ["Standard (W011/Y011)"], description: "Triple window arrangement, 2140mm" },
      { code: "W012/Y012 (W622A2S)", name: "1200mm Wall – 2 Windows 622", width: 1200, variants: ["Standard (W012/Y012)"], description: "Double window 622 series" },
      { code: "W013/Y013 (W622F1S)", name: "1200mm Wall – Fixed 622", width: 1200, variants: ["Standard (W013/Y013)"], description: "Fixed light 622 series" },
      { code: "W030/Y030 (W322F1S)", name: "1200mm Wall – Fixed 322 (3.2m wide)", width: 1200, variants: ["Standard (W030/Y030)", "Left End (W030L/Y030L)", "Right End (W030R/Y030R)"], description: "Fixed light, 440mm side frames, 320mm center" },
    ]
  },
  {
    key: "1.8m",
    label: "1.8m Module Walls",
    series: "WY050-079",
    walls: [
      { code: "W050/YS050", name: "1800mm Standard Wall", width: 1800, variants: ["Standard (W050/YS050)", "Left End (W050L/Y050L)", "Right End (W050R/Y050L)", "Deck (W050D/Y050D)"], description: "1800mm plain wall panel" },
      { code: "W051D/Y051D", name: "1800mm Deck Wall – Window (1250×2160)", width: 1800, variants: ["Deck (W051D/Y051D)"], description: "1250mm window opening, 275mm side frames, 2160mm height" },
    ]
  },
  {
    key: "2.4m",
    label: "2.4m Module Walls",
    series: "WY200-229",
    walls: [
      { code: "W200/Y200", name: "2400mm Standard Wall", width: 2400, variants: ["Standard (W200/Y200)", "Left End (W200L/Y200L)", "Right End (W200R/Y200R)", "Deck (W200D/Y200D)"], description: "2400mm plain wall panel" },
      { code: "W201D/Y201D (O1822)", name: "2400mm Deck Wall – Opening 1822", width: 2400, variants: ["Deck (W201D/Y201D)"], description: "Opening 1850mm wide, 275mm side frames – LOADED" },
      { code: "W202/Y202 (L1822)", name: "2400mm Wall – Louvre 1822", width: 2400, variants: ["Standard (W202/Y202)"], description: "Louvre panel 1820mm, 290mm frames – LOADED" },
    ]
  },
  {
    key: "3.0m-500",
    label: "3.0m Module Walls – Series 500",
    series: "WY500-529",
    walls: [
      { code: "W500/Y500", name: "3000mm Standard Wall", width: 3000, variants: ["Standard (W500/Y500)", "Left End (W500L/Y500L)", "Right End (W500R/Y500R)", "Deck (W500D/Y500D)"], description: "3000mm plain wall panel" },
      { code: "W501/Y501 (L2122)", name: "3000mm Wall – Louvre 2122", width: 3000, variants: ["Standard (W501/Y501)", "Left End (W501L/Y501L)", "Right End (W501R/Y501R)"], description: "Louvre 2120mm, 440mm side frames, 2180mm height" },
      { code: "W502/Y502 (W2122A8S)", name: "3000mm Wall – 8-Panel Window 2122", width: 3000, variants: ["Standard (W502/Y502)", "Left End (W502L/YE502L)", "Right End (W502R/YE502R)"], description: "8-pane window, 440×2120×440mm" },
      { code: "W503/Y503 (D2122S2RS)", name: "3000mm Wall – Door Right + 2 Sidelights", width: 3000, variants: ["Standard (W503/Y503)", "Left End (W503L/YE503L)", "Right End (W503R/YE503R)"], description: "Door with 2 sidelights right-swing" },
      { code: "W504/Y504 (D2122S2LS)", name: "3000mm Wall – Door Left + 2 Sidelights", width: 3000, variants: ["Standard (W504/Y504)", "Left End (W504L/YE504L)", "Right End (W504R/YE504R)"], description: "Door with 2 sidelights left-swing" },
      { code: "W505/Y505 (D2122B3LS)", name: "3000mm Wall – Bifold 3-Panel Left", width: 3000, variants: ["Standard (W505/Y505)", "Left End (W505L/Y505L)", "Right End (W505R/Y505R)"], description: "3-panel bifold, left opening" },
      { code: "W506/Y506 (D2122B3RS)", name: "3000mm Wall – Bifold 3-Panel Right", width: 3000, variants: ["Standard (W506/Y506)", "Left End (W506L/Y506L)", "Right End (W506R/Y506R)"], description: "3-panel bifold, right opening" },
      { code: "W507/Y507 (D2122D2S)", name: "3000mm Wall – Double Door 2122", width: 3000, variants: ["Standard (W507/Y507)", "Left End (W507L/Y507L)", "Right End (W507R/Y507R)"], description: "Double door 2122 series" },
      { code: "W510/Y510 (L2422)", name: "3000mm Wall – Louvre 2422", width: 3000, variants: ["Standard (W510/Y510)", "Deck (W510D/Y510D)"], description: "Louvre 2450mm wide, 275mm frames, 2160mm height" },
      { code: "W511/Y511 (W2422A8S)", name: "3000mm Wall – 8-Panel Window 2422", width: 3000, variants: ["Standard (W511/Y511)"], description: "8-pane window 2422 series" },
      { code: "W512/Y512 (D2422S2RS)", name: "3000mm Wall – Door Right Sidelight 2422", width: 3000, variants: ["Standard (W512/Y512)"], description: "Door + sidelights right, 2422 series" },
      { code: "W513/Y513 (D2422S2LS)", name: "3000mm Wall – Door Left Sidelight 2422", width: 3000, variants: ["Standard (W513/Y513)"], description: "Door + sidelights left, 2422 series" },
      { code: "W514/Y514 (D2422B3LS)", name: "3000mm Wall – Bifold 3 Left 2422", width: 3000, variants: ["Standard (W514/Y514)"], description: "3-panel bifold left, 2422 series" },
      { code: "W515/Y515 (D2422B3RS)", name: "3000mm Wall – Bifold 3 Right 2422", width: 3000, variants: ["Standard (W515/Y515)"], description: "3-panel bifold right, 2422 series" },
      { code: "W516/Y516 (D2422D4S)", name: "3000mm Wall – 4-Panel Door 2422", width: 3000, variants: ["Standard (W516/Y516)"], description: "4-panel door, 2422 series" },
      { code: "W517/Y517 (D2422SA4RS)", name: "3000mm Wall – Sliding 4-Panel Right", width: 3000, variants: ["Standard (W517/Y517)"], description: "4-panel sliding right, 2422 series" },
      { code: "W518/Y518 (D2422SA4LS)", name: "3000mm Wall – Sliding 4-Panel Left", width: 3000, variants: ["Standard (W518/Y518)"], description: "4-panel sliding left, 2422 series" },
      { code: "W519/Y519 (D2422B3L1RS)", name: "3000mm Wall – Bifold 3+1 Right 2422", width: 3000, variants: ["Standard (W519/Y519)"], description: "3+1 bifold combo right, 2422 series" },
      { code: "W520/Y520 (D2422B3R1LS)", name: "3000mm Wall – Bifold 3+1 Left 2422", width: 3000, variants: ["Standard (W520/Y520)"], description: "3+1 bifold combo left, 2422 series" },
      { code: "W521/Y521 (W2422A6S)", name: "3000mm Wall – 6-Panel Window 2422", width: 3000, variants: ["Standard (W521/Y521)"], description: "6-pane window, 2422 series" },
      { code: "W522/Y522", name: "3000mm Wall – Cross Brace 2422 (A)", width: 3000, variants: ["Standard (W522/Y522)"], description: "Cross-brace panel variant A" },
      { code: "W523/Y523", name: "3000mm Wall – Cross Brace 2422 (B)", width: 3000, variants: ["Standard (W523/Y523)"], description: "Cross-brace panel variant B" },
    ]
  },
  {
    key: "3.0m-530",
    label: "3.0m Module Walls – Series 530",
    series: "WY530-559",
    walls: [
      { code: "W530/Y530 (W249B4C)", name: "3000mm Wall – 4-Panel Cross Brace", width: 3000, variants: ["Standard (W530/Y530)"], description: "4-panel cross brace, 920×920mm bays" },
      { code: "W531/Y531 (W249S4)", name: "3000mm Wall – 4-Panel Stacked", width: 3000, variants: ["Standard (W531/Y531)"], description: "4-panel stacked windows, 920mm bays" },
      { code: "W532/Y532 (W249A3)", name: "3000mm Wall – 3-Panel Awning", width: 3000, variants: ["Standard (W532/Y532)"], description: "3-panel awning windows" },
      { code: "W540/Y540 (W216A1)", name: "3000mm Wall – 1-Window Corner 216", width: 3000, variants: ["Standard (W540/Y540)", "Left End (W540L/Y540L)", "Right End (W540R/Y540R)"], description: "Corner window 1520×620mm in 3m wall" },
      { code: "W550/Y550", name: "3000mm Wall – Standard 550", width: 3000, variants: ["Standard (W550/Y550)", "Left End (W550L/Y550L)", "Right End (W550R/Y550R)"], description: "3000mm standard panel" },
      { code: "W551/Y551", name: "3000mm Wall – Cross Brace 551", width: 3000, variants: ["Standard (W551/Y551)", "Left End (W551L/Y551L)", "Right End (W551R/Y551R)"], description: "3000mm cross-brace panel" },
    ]
  },
  {
    key: "3.0m-650",
    label: "3.0m Module Walls – Series 650 (Louvre & Highlight)",
    series: "WY650-660",
    walls: [
      { code: "W651/Y651 (D1222LHRSG)", name: "3000mm Wall – Louvre Highlight Right Sliding", width: 3000, variants: ["Standard (W651/Y651)", "Left End (W651L/Y651L)", "Right End (W651R/Y651R)"], description: "890mm + 1220mm + 890mm louvre/highlight right sliding glass" },
      { code: "W652/Y652 (D1222LHLSG)", name: "3000mm Wall – Louvre Highlight Left Sliding", width: 3000, variants: ["Standard (W652/Y652)", "Left End (W652L/Y652L)", "Right End (W652R/Y652R)"], description: "Louvre highlight left sliding glass" },
      { code: "W653/Y653 (D1222LHRTGV)", name: "3000mm Wall – Louvre Highlight Right TGV", width: 3000, variants: ["Standard (W653/Y653)", "Left End (W653L/Y653L)", "Right End (W653R/Y653R)"], description: "Louvre highlight right TGV cladding" },
      { code: "W654/Y654 (D1222LHLTGV)", name: "3000mm Wall – Louvre Highlight Left TGV", width: 3000, variants: ["Standard (W654/Y654)", "Left End (W654L/Y654L)", "Right End (W654R/Y654R)"], description: "Louvre highlight left TGV cladding" },
      { code: "W655/Y655 (D1222LDILSG)", name: "3000mm Wall – Low Door Louvre Left SG", width: 3000, variants: ["Standard (W655/Y655)", "Left End (W655L/Y655L)", "Right End (W655R/Y655R)"], description: "Low-level door + louvre, left, sliding glass" },
      { code: "W656/Y656 (D1222LDIRSG)", name: "3000mm Wall – Low Door Louvre Right SG", width: 3000, variants: ["Standard (W656/Y656)", "Left End (W656L/Y656L)", "Right End (W656R/Y656R)"], description: "Low-level door + louvre, right, sliding glass" },
      { code: "W657/Y657 (D1222LDILTGV)", name: "3000mm Wall – Low Door Louvre Left TGV", width: 3000, variants: ["Standard (W657/Y657)", "Left End (W657L/Y657L)", "Right End (W657R/Y657R)"], description: "Low door + louvre left TGV cladding" },
      { code: "W658/Y658 (D1222LDIRTGV)", name: "3000mm Wall – Low Door Louvre Right TGV", width: 3000, variants: ["Standard (W658/Y658)", "Left End (W658L/Y658L)", "Right End (W658R/Y658R)"], description: "Low door + louvre right TGV cladding" },
    ]
  },
  {
    key: "3.0m-700",
    label: "3.0m Module Walls – Series 700 (Corner)",
    series: "WY700-703",
    walls: [
      { code: "W700/Y700 (W622CL2S)", name: "3000mm Corner Wall – Window Left 622", width: 3000, variants: ["Standard (W700/Y700)", "Left End (W700L)"], description: "290+620+2090mm corner window, left-hand" },
      { code: "W701/Y701 (W622CR2S)", name: "3000mm Corner Wall – Window Right 622", width: 3000, variants: ["Standard (W701/Y701)", "Right End (Y700R)"], description: "290+620+2090mm corner window, right-hand" },
      { code: "W702/Y702 (W622CL2S)", name: "3000mm Corner Wall – Window Left Mirror", width: 3000, variants: ["Standard (W702/Y702)", "Right End (W702R)"], description: "2090+620+290mm corner window, left mirror" },
      { code: "W703/Y703 (W622CR2S)", name: "3000mm Corner Wall – Window Right Mirror", width: 3000, variants: ["Standard (W703/Y703)", "Left End (Y703L)"], description: "2090+620+290mm corner window, right mirror" },
    ]
  },
  {
    key: "3.0m-800",
    label: "3.0m Module Walls – Series 800/900 (Offset Window)",
    series: "WY800-810/900-910",
    walls: [
      { code: "W801/Y801 (D0922HLSG)", name: "3000mm Wall – High Left Door SG", width: 3000, variants: ["Standard (W801/Y801)", "Left End (W801L/Y801L)", "Right End (W801R/Y801R)"], description: "440+920+1640mm, door left, sliding glass" },
      { code: "W802/Y802 (D0922HRSG)", name: "3000mm Wall – High Right Door SG", width: 3000, variants: ["Standard (W802/Y802)", "Left End (W802L/Y802L)", "Right End (W802R/Y802R)"], description: "440+920+1640mm, door right, sliding glass" },
      { code: "W803/Y803 (D0922HLTGV)", name: "3000mm Wall – High Left Door TGV", width: 3000, variants: ["Standard (W803/Y803)", "Left End (W803L/Y803L)", "Right End (W803R/Y803R)"], description: "Door left TGV cladding" },
      { code: "W804/Y804 (D0922HRTGV)", name: "3000mm Wall – High Right Door TGV", width: 3000, variants: ["Standard (W804/Y804)", "Left End (W804L/Y804L)", "Right End (W804R/Y804R)"], description: "Door right TGV cladding" },
      { code: "W805/Y805 (W922A2S)", name: "3000mm Wall – 2 Windows 922 (800s)", width: 3000, variants: ["Standard (W805/Y805)", "Left End (W805L/Y805L)", "Right End (W805R/Y805R)"], description: "2-pane window, 440+920+1640mm" },
      { code: "W806/Y806 (W922F1S)", name: "3000mm Wall – Fixed Window 922 (800s)", width: 3000, variants: ["Standard (W806/Y806)", "Left End (W806L/Y806L)", "Right End (W806R/Y806R)"], description: "Fixed light window 922 series" },
      { code: "W807/Y807 (W922A3S)", name: "3000mm Wall – 3 Windows 922 (800s)", width: 3000, variants: ["Standard (W807/Y807)", "Left End (W807L/Y807L)", "Right End (W807R/Y807R)"], description: "3-pane awning window" },
      { code: "W901/Y901 (D0922HRSG)", name: "3000mm Wall – High Right Door SG (900s)", width: 3000, variants: ["Standard (W901/Y901)", "Left End (W901L/Y901L)", "Right End (W901R/Y901R)"], description: "Mirror of 801 – door right sliding glass, 900 series" },
      { code: "W902/Y902 (D0922HLSG)", name: "3000mm Wall – High Left Door SG (900s)", width: 3000, variants: ["Standard (W902/Y902)", "Left End (W902L/Y902L)", "Right End (W902R/Y902R)"], description: "900 series left sliding glass door" },
      { code: "W903/Y903 (D0922HRTGV)", name: "3000mm Wall – High Right TGV (900s)", width: 3000, variants: ["Standard (W903/Y903)", "Left End (W903L/Y903L)", "Right End (W903R/Y903R)"], description: "900 series right TGV" },
      { code: "W904/Y904 (D0922HLTGV)", name: "3000mm Wall – High Left TGV (900s)", width: 3000, variants: ["Standard (W904/Y904)", "Left End (W904L/Y904L)", "Right End (W904R/Y904R)"], description: "900 series left TGV" },
      { code: "W905/Y905 (W922A2S)", name: "3000mm Wall – 2 Windows 922 (900s)", width: 3000, variants: ["Standard (W905/Y905)", "Left End (W905L/Y905L)", "Right End (W905R/Y905R)"], description: "2-pane window 922, 900 series" },
      { code: "W906/Y906 (W922F1S)", name: "3000mm Wall – Fixed Window 922 (900s)", width: 3000, variants: ["Standard (W906/Y906)", "Left End (W906L/Y906L)", "Right End (W906R/Y906R)"], description: "Fixed light 922, 900 series" },
      { code: "W907/Y907 (W922A3S)", name: "3000mm Wall – 3 Windows 922 (900s)", width: 3000, variants: ["Standard (W907/Y907)", "Left End (W907L/Y907L)", "Right End (W907R/Y907R)"], description: "3-pane awning 922, 900 series" },
      { code: "W811/Y811 (W622A2S)", name: "3000mm Wall – 2 Windows 622 (811)", width: 3000, variants: ["Standard (W811/Y811)", "Left End (W811L)"], description: "290+620+2090mm, 2 windows, 2145mm height" },
      { code: "W911/Y911 (W622A2S)", name: "3000mm Wall – 2 Windows 622 (911)", width: 3000, variants: ["Standard (W911/Y911)", "Right End (W911R)"], description: "2090+620+290mm mirror, 900 series" },
    ]
  },
  {
    key: "3.0m-851",
    label: "3.0m Module Walls – Series 851/951 (Corner Windows)",
    series: "WY851-860/951-960",
    walls: [
      { code: "W851/Y851 (W1212AF2)", name: "3000mm Wall – Corner AF2 Left", width: 3000, variants: ["Standard (W851/Y851)", "Left End (W851L/Y851L)", "Right End (W851R/Y851R)"], description: "390+1220+1390mm, 2-pane awning left" },
      { code: "W852/Y852 (W1212FA2)", name: "3000mm Wall – Corner FA2 Left", width: 3000, variants: ["Standard (W852/Y852)", "Left End (W852L/Y852L)", "Right End (W852R/Y852R)"], description: "400+1200+1400mm, fixed+awning left" },
      { code: "W853/Y853 (W1212F1)", name: "3000mm Wall – Fixed 1212 Left", width: 3000, variants: ["Standard (W853/Y853)", "Left End (W853L/Y853L)", "Right End (W853R/Y853R)"], description: "390+1220+1390mm, fixed window left" },
      { code: "W951/Y951 (W1212AF2)", name: "3000mm Wall – Corner AF2 Right", width: 3000, variants: ["Standard (W951/Y951)", "Left End (W951L/Y951L)", "Right End (W951R/Y951R)"], description: "1329+1220+451mm, 2-pane awning right" },
      { code: "W952/Y952 (W1212FA2)", name: "3000mm Wall – Corner FA2 Right", width: 3000, variants: ["Standard (W952/Y952)", "Left End (W952L/Y952L)", "Right End (W952R/Y952R)"], description: "1390+1220+390mm, fixed+awning right" },
      { code: "W953/Y953 (W1212F1)", name: "3000mm Wall – Fixed 1212 Right", width: 3000, variants: ["Standard (W953/Y953)", "Left End (W953L/Y953L)", "Right End (W953R/Y953R)"], description: "1390+1220+390mm, fixed window right" },
      { code: "W861/Y861", name: "3000mm Wall – Highlight 861", width: 3000, variants: ["Standard (W861/Y861)", "Left End (W861L)"], description: "Highlight window panel, bifold/stacked TBC" },
      { code: "W961/Y961", name: "3000mm Wall – Highlight 961 (2250×320)", width: 3000, variants: ["Standard (W961/Y961)", "Left End (W961L/Y961L)", "Right End (W961R/Y961R)"], description: "2250+320+430mm highlight window" },
    ]
  },
  {
    key: "3.0m-871",
    label: "3.0m Module Walls – Series 871/971 (Large Opening)",
    series: "WY871-880/971-980",
    walls: [
      { code: "W871/Y871 (L1822)", name: "3000mm Wall – Louvre 1822 (Left)", width: 3000, variants: ["Standard (W871/Y871)", "Left End (W871L)"], description: "290+1820+890mm louvre panel, 15mm reveal" },
      { code: "W872/Y872 (D1822S2RS)", name: "3000mm Wall – Door Right 1822 (Left)", width: 3000, variants: ["Standard (W872/Y872)", "Left End (W872L)"], description: "Door right + 2 sidelights, 1822 joinery" },
      { code: "W873/Y873 (D1822S2LS)", name: "3000mm Wall – Door Left 1822 (Left)", width: 3000, variants: ["Standard (W873/Y873)", "Left End (W873L)"], description: "Door left + 2 sidelights, 1822 joinery" },
      { code: "W971/Y971 (L1822)", name: "3000mm Wall – Louvre 1822 (Right)", width: 3000, variants: ["Standard (W971/Y971)", "Right End (W971R)"], description: "890+1820+290mm louvre panel, mirror" },
      { code: "W972/Y972 (D1822S2RS)", name: "3000mm Wall – Door Right 1822 (Right)", width: 3000, variants: ["Standard (W972/Y972)", "Right End (W972R)"], description: "Door right 1822, 900 mirror series" },
      { code: "W973/Y973 (D1822S2LS)", name: "3000mm Wall – Door Left 1822 (Right)", width: 3000, variants: ["Standard (W973/Y973)", "Right End (W973R)"], description: "Door left 1822, 900 mirror series" },
    ]
  },
  {
    key: "gable",
    label: "5.2m Family Gable Walls",
    series: "ZX000-310",
    walls: [
      { code: "Z000-F/X000-F", name: "Gable – Plain", width: 5200, variants: ["Standard (Z000-F/X000-F)"], description: "Full gable wall, no openings" },
      { code: "Z001-F/X001-F (D4222S4SG)", name: "Gable – 4 Sidelights 4222", width: 5200, variants: ["Standard (Z001-F/X001-F)"], description: "290+4220+290mm, 4 sidelights, 2160mm" },
      { code: "Z010-F/X010-F (D3022S4SG)", name: "Gable – 4 Sidelights 3022", width: 5200, variants: ["Standard (Z010-F/X010-F)"], description: "590+3620+590mm, 4 sidelights, 2160mm" },
      { code: "Z020-F/X020-F (D3622S4SG)", name: "Gable – 4 Sidelights 3622", width: 5200, variants: ["Standard (Z020-F/X020-F)"], description: "890+3020+890mm, 4 sidelights, 2160mm" },
      { code: "Z021-F/X021-F (D3622B2L2RSG)", name: "Gable – Bifold 2+2 Right 3622", width: 5200, variants: ["Standard (Z021-F/X021-F)"], description: "590+3620+890mm bifold 2+2 right sliding glass" },
      { code: "Z030-F/X030-F (D2422S4SG)", name: "Gable – 4 Sidelights 2422", width: 5200, variants: ["Standard (Z030-F/X030-F)"], description: "1190+2420+1190mm, 4 sidelights" },
      { code: "Z040-F/X040-F (D2122S2RS)", name: "Gable – Door Right 2122", width: 5200, variants: ["Standard (Z040-F/X040-F)"], description: "Gable with door right, 2122 joinery" },
      { code: "Z041-F/X041-F (D2122S2LS)", name: "Gable – Door Left 2122", width: 5200, variants: ["Standard (Z041-F/X041-F)"], description: "Gable with door left, 2122 joinery" },
      { code: "Z050-F/X050-F (D1822S2RS)", name: "Gable – Door Right 1822", width: 5200, variants: ["Standard (Z050-F/X050-F)"], description: "Gable with door right, 1822 joinery" },
      { code: "Z051-F/X051-F (D1822S2LS)", name: "Gable – Door Left 1822", width: 5200, variants: ["Standard (Z051-F/X051-F)"], description: "Gable with door left, 1822 joinery" },
      { code: "Z080-F/X080-F (W3015A5S)", name: "Gable – 5-Panel Awning 3015", width: 5200, variants: ["Standard (Z080-F/X080-F)"], description: "185+890+3020+890+185mm, 5 awning panes" },
      { code: "Z100-F/X100-F", name: "Gable – Single Door Narrow", width: 4800, variants: ["Standard (Z100-F/X100-F)"], description: "Narrow gable with single door" },
      { code: "Z101-F/X101-F", name: "Gable – Single Door 4800", width: 4800, variants: ["Standard (Z101-F/X101-F)"], description: "4800mm wide gable, 2090+2120+590mm" },
      { code: "Z102-F/X102-F", name: "Gable – Plain 4800 (variant)", width: 4800, variants: ["Standard (Z102-F/X102-F)"], description: "4800mm gable variant" },
      { code: "Z104-F/X104-F", name: "Gable – Plain 4800 (variant B)", width: 4800, variants: ["Standard (Z104-F/X104-F)"], description: "4800mm gable variant B" },
      { code: "Z300-F/X300-F (W1212FAR2+W912FAL2)", name: "Gable – Dual Window 4800", width: 4800, variants: ["Standard (Z300-F/X300-F)"], description: "590+1220+1630+1220+140mm, dual window arrangement" },
      { code: "Z310-F/X310-F (W1212FAR2)", name: "Gable – Single Window Right 4800", width: 4800, variants: ["Standard (Z310-F/X310-F)"], description: "590+1220+2990mm, right-side window" },
    ]
  },
  {
    key: "musgrove",
    label: "3.0m Musgrove Joinery Walls",
    series: "WYM200-220",
    walls: [
      { code: "WM201/YM201 (MD1820S2R-PLU89399)", name: "Musgrove – Door Right 1820", width: 3000, variants: ["Standard (WM201/YM201)", "Left End (WM201L/YM201L)", "Right End (WM201R/YM201R)"], description: "795+1815+390mm, door right sliding, PLU89399, 15mm reveal" },
      { code: "WM202/YM202", name: "Musgrove – Plain 3000", width: 3000, variants: ["Standard (WM202/YM202)", "Left End (WM202L/YM202L)", "Right End (WM202R/YM202R)"], description: "3000mm plain Musgrove wall" },
      { code: "WM203/YM203 (MD1820S2R-PLU89399)", name: "Musgrove – Door Left 1820", width: 3000, variants: ["Standard (WM203/YM203)", "Left End (WM203L/YM203L)", "Right End (WM203R/YM203R)"], description: "390+1815+795mm mirror of WM201" },
      { code: "WM204/YM204", name: "Musgrove – Plain Mirror 3000", width: 3000, variants: ["Standard (WM204/YM204)", "Left End (WM204L/YM204L)", "Right End (WM204R/YM204R)"], description: "3000mm plain mirror" },
      { code: "WM205/YM205 (MW1509A2-PLU94686)", name: "Musgrove – 2-Panel Awning Left 1509", width: 3000, variants: ["Standard (WM205/YM205)", "Left End (WM205L/YM205L)", "Right End (WM205R/YM205R)"], description: "1040+1520+440mm, 2 awning windows, PLU94686" },
      { code: "WM206/YM206 (MW1509A2-PLU94686)", name: "Musgrove – 2-Panel Awning Right 1509", width: 3000, variants: ["Standard (WM206/YM206)", "Left End (WM206L/YM206L)", "Right End (WM206R/YM206R)"], description: "440+1520+1040mm mirror of WM205" },
      { code: "WM207/YM207 (MW0909A1S-PLU99707)", name: "Musgrove – 1-Panel Opaque Left 0909", width: 3000, variants: ["Standard (WM207/YM207)", "Left End (WM207L/YM207L)", "Right End (WM207R/YM207R)"], description: "1640+920+440mm, opaque safety glass, PLU99707" },
      { code: "WM208/YM208 (MW0909A1S-PLU99707)", name: "Musgrove – 1-Panel Opaque Right 0909", width: 3000, variants: ["Standard (WM208/YM208)", "Left End (WM208L/YM208L)", "Right End (WM208R/YM208R)"], description: "440+920+1640mm mirror, opaque safety glass" },
      { code: "WM209/YM209 (MD0921HLSG-PLU90858)", name: "Musgrove – High Left Door SG 0921", width: 3000, variants: ["Standard (WM209/YM209)", "Left End (WM209L/YM209L)", "Right End (WM209R/YM209R)"], description: "440+920+1640mm, high left door sliding glass, PLU90858" },
    ]
  },
  {
    key: "musgrove-gable",
    label: "5.2m Musgrove Joinery Gable Walls",
    series: "XZM000-010",
    walls: [
      { code: "ZM031-F/XM031-F (MD1820S2RG-PLU89399)", name: "Musgrove Gable – Door Right 1820", width: 5200, variants: ["Standard (ZM031-F/XM031-F)"], description: "185+2335+1815+650+185mm, gable door right" },
      { code: "ZM032-F/XM032-F (MD1820S2LG-PLU89399)", name: "Musgrove Gable – Door Left 1820", width: 5200, variants: ["Standard (ZM032-F/XM032-F)"], description: "Gable door left, PLU89399, 15mm reveal" },
      { code: "ZM033-F/XM033-F (MD1820S2RG-PLU89399)", name: "Musgrove Gable – Door Right 1820 (B)", width: 5200, variants: ["Standard (ZM033-F/XM033-F)"], description: "Variant B, door right gable" },
      { code: "ZM034-F/XM034-F (MD1820S2LG-PLU89399)", name: "Musgrove Gable – Door Left 1820 (B)", width: 5200, variants: ["Standard (ZM034-F/XM034-F)"], description: "Variant B, door left gable" },
      { code: "ZM035-F/XM035-F (MW1509A2-PLU94686)", name: "Musgrove Gable – 2-Panel Awning Left", width: 5200, variants: ["Standard (ZM035-F/XM035-F)"], description: "185+590+1520+2690+185mm, 2 awning panes left" },
      { code: "ZM036-F/XM036-F (MW1509A2-PLU94686)", name: "Musgrove Gable – 2-Panel Awning Right", width: 5200, variants: ["Standard (ZM036-F/XM036-F)"], description: "Mirror of ZM035, awning right" },
    ]
  },
];

const widthColors = {
  600: "bg-purple-100 text-purple-700",
  1200: "bg-blue-100 text-blue-700",
  1800: "bg-cyan-100 text-cyan-700",
  2400: "bg-teal-100 text-teal-700",
  3000: "bg-orange-100 text-orange-700",
  4800: "bg-red-100 text-red-700",
  5200: "bg-rose-100 text-rose-700",
};

export default function WallCatalogue() {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [addingToGroup, setAddingToGroup] = useState(null);
  const [editingWall, setEditingWall] = useState(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingUploadCode, setPendingUploadCode] = useState(null);

  const { data: wallImages = {} } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      const images = await base44.entities.WallImage.list();
      return Object.fromEntries(images.map(img => [img.wallType, img.imageUrl]));
    },
  });

  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: () => base44.entities.WallEntry.list(),
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: () => base44.entities.DeletedWall.list(),
  });
  const deletedCodes = new Set(deletedWalls.map(d => d.wallCode));

  const handleDeleteBuiltinWall = async (code) => {
    await base44.entities.DeletedWall.create({ wallCode: code });
    queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
    toast.success("Wall hidden");
  };

  const handleRestoreWall = async (code) => {
    const entry = deletedWalls.find(d => d.wallCode === code);
    if (entry) {
      await base44.entities.DeletedWall.delete(entry.id);
      queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
      toast.success("Wall restored");
    }
  };

  const handleAddWall = async (data) => {
    await base44.entities.WallEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    setAddingToGroup(null);
    toast.success("Wall added");
  };

  const handleDeleteWall = async (entryId) => {
    await base44.entities.WallEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    toast.success("Wall removed");
  };

  const handleEditWall = async (data) => {
    if (editingWall._custom) {
      await base44.entities.WallEntry.update(editingWall._id, {
        ...data,
        groupKey: editingWall._groupKey,
        originalCode: editingWall.originalCode || undefined,
      });
    } else {
      // Check if there's already a custom override for this built-in
      const existingOverride = customWalls.find(c => c.originalCode === editingWall.code);
      if (existingOverride) {
        // Update the existing override
        await base44.entities.WallEntry.update(existingOverride.id, {
          ...data,
          groupKey: editingWall._groupKey,
          originalCode: editingWall.code,
        });
      } else {
        // First time editing this built-in: hide it and create override
        await Promise.all([
          base44.entities.DeletedWall.create({ wallCode: editingWall.code }),
          base44.entities.WallEntry.create({
            ...data,
            groupKey: editingWall._groupKey,
            originalCode: editingWall.code,
          }),
        ]);
      }
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["wallEntries"] }),
      queryClient.invalidateQueries({ queryKey: ["deletedWalls"] }),
    ]);
    setEditingWall(null);
    toast.success("Wall updated");
  };

  const handleUploadClick = (code) => {
    setPendingUploadCode(code);
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !pendingUploadCode) return;
    e.target.value = "";
    setUploading(pendingUploadCode);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    const existing = await base44.entities.WallImage.filter({ wallType: pendingUploadCode });
    if (existing.length > 0) {
      await base44.entities.WallImage.update(existing[0].id, { imageUrl: file_url });
    } else {
      await base44.entities.WallImage.create({ wallType: pendingUploadCode, imageUrl: file_url });
    }
    queryClient.invalidateQueries({ queryKey: ["wallImages"] });
    setUploading(null);
    toast.success("Image updated");
  };

  const handleRemoveImage = async (code) => {
    const existing = await base44.entities.WallImage.filter({ wallType: code });
    if (existing.length > 0) {
      await base44.entities.WallImage.delete(existing[0].id);
      queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      toast.success("Image removed");
    }
  };

  // Deleted codes that have a custom override (stored via originalCode field)
  const overriddenCodes = new Set(customWalls.filter(c => c.originalCode).map(c => c.originalCode));

  // Merge hardcoded + custom entries per group, filtering out deleted built-ins
  const allGroups = WALL_GROUPS.map(g => ({
    ...g,
    walls: [
      ...g.walls
        .filter(w => {
          if (overriddenCodes.has(w.code)) return false; // has a custom replacement, always hide
          if (!deletedCodes.has(w.code)) return true; // not deleted
          return editMode; // deleted with no override: show greyed only in edit mode
        })
        .map(w => ({ ...w, _custom: false, _deleted: deletedCodes.has(w.code), _groupKey: g.key })),
      ...customWalls.filter(c => c.groupKey === g.key).map(c => ({
        code: c.code, name: c.name, width: c.width || 3000,
        description: c.description || "", variants: c.variants || [],
        _custom: true, _id: c.id, _deleted: false, _groupKey: g.key,
      })),
    ],
  }));

  const filtered = allGroups
    .filter(g => activeGroup === "all" || g.key === activeGroup)
    .map(g => ({
      ...g,
      walls: g.walls.filter(w =>
        search === "" ||
        w.code.toLowerCase().includes(search.toLowerCase()) ||
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        (w.description || "").toLowerCase().includes(search.toLowerCase())
      )
    }))
    .filter(g => g.walls.length > 0 || editMode);

  const totalWalls = allGroups.reduce((s, g) => s + g.walls.length, 0);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("Configurator")} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#F15A22] transition-colors">
              <ChevronLeft size={16} />
              Configurator
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <span className="text-base font-bold text-gray-900 tracking-tight">connectapod</span>
              <span className="ml-2 text-xs text-gray-400">Wall Catalogue</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm border transition-all ${editMode ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              <Pencil size={13} />
              {editMode ? "Done Editing" : "Edit Images"}
            </button>
            <div className="relative w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-none bg-gray-50 focus:outline-none focus:border-[#F15A22]"
              />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        {/* Group filter */}
        <div className="max-w-7xl mx-auto px-6 pb-2 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveGroup("all")}
            className={`shrink-0 px-3 py-1 text-xs border transition-all ${activeGroup === "all" ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
          >
            All ({totalWalls})
          </button>
          {WALL_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              className={`shrink-0 px-3 py-1 text-xs border transition-all ${activeGroup === g.key ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              {g.label.split("–")[0].trim()} ({g.walls.length})
            </button>
          ))}
        </div>
      </div>

      {editingWall && (
        <EditWallModal
          wall={editingWall}
          onSave={handleEditWall}
          onClose={() => setEditingWall(null)}
        />
      )}

      {addingToGroup && (
        <AddWallModal
          groupKey={addingToGroup.key}
          groupLabel={addingToGroup.label}
          onSave={handleAddWall}
          onClose={() => setAddingToGroup(null)}
        />
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {filtered.map(group => (
          <div key={group.key}>
            <div className="mb-4 pb-2 border-b border-gray-200 flex items-baseline gap-3">
              <h2 className="text-base font-bold text-gray-800">{group.label}</h2>
              <span className="text-xs text-gray-400 font-mono">{group.series}</span>
              <span className="ml-auto text-xs text-gray-400">{group.walls.length} panels</span>
              {editMode && (
                <button
                  onClick={() => setAddingToGroup(group)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#F15A22] border border-[#F15A22] hover:bg-[#F15A22] hover:text-white transition-colors"
                >
                  <Plus size={11} /> Add Wall
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.walls.map(wall => (
                <div key={wall._custom ? `custom-${wall._id}` : wall.code} className={`bg-white border p-4 transition-colors group relative ${wall._deleted ? "border-red-200 opacity-50" : "border-gray-200 hover:border-[#F15A22]"}`}>
                  {/* Width badge + delete */}
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${widthColors[wall.width] || "bg-gray-100 text-gray-600"}`}>
                      {(wall.width / 1000).toFixed(1)}m
                    </span>
                    {editMode && (
                      wall._deleted ? (
                        <button
                          onClick={() => handleRestoreWall(wall.code)}
                          className="text-xs text-green-600 hover:underline"
                          title="Restore this wall"
                        >
                          Restore
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingWall(wall)}
                            className="text-gray-300 hover:text-[#F15A22] transition-colors"
                            title="Edit this wall"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => wall._custom ? handleDeleteWall(wall._id) : handleDeleteBuiltinWall(wall.code)}
                            className="text-gray-300 hover:text-red-500 transition-colors"
                            title="Remove this wall"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )
                    )}
                  </div>

                  {/* Wall image */}
                  <div className="w-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 relative" style={{ aspectRatio: "9/16" }}>
                    {uploading === wall.code ? (
                      <Loader2 size={20} className="animate-spin text-[#F15A22]" />
                    ) : wallImages[wall.code] ? (
                      <img src={wallImages[wall.code]} alt={wall.name} className="w-full h-full object-contain" />
                    ) : (
                      <div
                        className="bg-gray-300 border border-gray-400"
                        style={{ width: "60%", height: `${Math.min(70, (wall.width / 5200) * 50 + 20)}%` }}
                      />
                    )}
                    {editMode && uploading !== wall.code && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleUploadClick(wall.code)}
                          className="flex items-center gap-1 px-2 py-1 bg-white text-gray-800 text-xs font-medium hover:bg-[#F15A22] hover:text-white transition-colors"
                        >
                          <Upload size={11} /> Upload
                        </button>
                        {wallImages[wall.code] && (
                          <button
                            onClick={() => handleRemoveImage(wall.code)}
                            className="flex items-center gap-1 px-2 py-1 bg-white text-red-600 text-xs font-medium hover:bg-red-600 hover:text-white transition-colors"
                          >
                            <X size={11} /> Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-gray-800 leading-tight mb-1 group-hover:text-[#F15A22] transition-colors">{wall.name}</p>
                  <p className="text-[10px] font-mono text-gray-400 mb-2">{wall.code}</p>
                  <p className="text-[11px] text-gray-500 mb-3 leading-relaxed">{wall.description}</p>

                  {/* Variants */}
                  <div className="space-y-0.5">
                    {wall.variants.map(v => (
                      <div key={v} className="text-[10px] text-gray-500 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-24 text-gray-400">
            <p className="text-lg font-medium">No walls found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>

      <div className="text-center py-6 text-xs text-gray-400 border-t border-gray-200 bg-white mt-8">
        connectapod Catalogue © 2022-SEP-b · {totalWalls} wall panels across {WALL_GROUPS.length} series
      </div>
    </div>
  );
}