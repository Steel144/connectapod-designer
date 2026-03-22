import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronLeft, Pencil, Upload, X, Loader2, Plus, Trash2, Printer, Copy } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { WallEntry, WallImage, DeletedWall, Storage } from "@/lib/supabase";
import { toast } from "sonner";
import AddWallModal from "@/components/catalogue/AddWallModal";
import EditWallModal from "@/components/catalogue/EditWallModal";
import PrintableCatalogue from "@/components/catalogue/PrintableCatalogue";

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
   key: "connection",
   label: "Connection Walls",
   series: "ZX400-410",
   walls: [
     { code: "ZC-STD/XC-STD", name: "Standard Connection Wall", width: 3000, variants: ["Connection"], description: "Standard connection module wall" },
     { code: "ZC-OPN/XC-OPN", name: "Opening Connection Wall", width: 3000, variants: ["Connection"], description: "Connection wall with opening" },
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
  const [printMode, setPrintMode] = useState(false);
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [pendingUploadCode, setPendingUploadCode] = useState(null);

  const { data: wallImages = {} } = useQuery({
    queryKey: ["wallImages"],
    queryFn: async () => {
      const images = await WallImage.list();
      return Object.fromEntries(images.map(img => [img.wallType, img.imageUrl]));
    },
  });

  const { data: customWalls = [] } = useQuery({
    queryKey: ["wallEntries"],
    queryFn: () => WallEntry.list(),
  });

  const { data: deletedWalls = [] } = useQuery({
    queryKey: ["deletedWalls"],
    queryFn: () => DeletedWall.list(),
  });
  const deletedCodes = new Set(deletedWalls.map(d => d.wallCode));

  const handleDeleteBuiltinWall = async (code) => {
    await DeletedWall.create({ wallCode: code });
    queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
    toast.success("Wall hidden");
  };

  const handlePermanentlyDeleteWall = async (code) => {
    const entry = deletedWalls.find(d => d.wallCode === code);
    if (entry) {
      await DeletedWall.delete(entry.id);
      queryClient.invalidateQueries({ queryKey: ["deletedWalls"] });
      toast.success("Wall permanently deleted");
    }
  };

  const handleAddWall = async (data) => {
    await WallEntry.create(data);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    setAddingToGroup(null);
    toast.success("Wall added");
  };

  const handleDeleteWall = async (entryId) => {
    await WallEntry.delete(entryId);
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    toast.success("Wall removed");
  };

  const handleDuplicateWall = async (wall, groupKey) => {
    const baseCodes = customWalls.filter(w => w.code.startsWith(wall.code)).map(w => w.code);
    const nextSuffix = baseCodes.length > 0 ? String.fromCharCode(97 + baseCodes.length) : "a";
    const newCode = `${wall.code}${nextSuffix}`;
    await WallEntry.create({
      groupKey,
      code: newCode,
      name: wall.name,
      width: wall.width,
      description: wall.description || "",
      variants: wall.variants || [],
      windowStyle: wall.windowStyle,
      openingPanes: wall.openingPanes,
      windowHeight: wall.windowHeight,
      windowWidth: wall.windowWidth,
      doorStyle: wall.doorStyle,
      doorHeight: wall.doorHeight,
      doorWidth: wall.doorWidth,
      price: wall.price,
    });
    queryClient.invalidateQueries({ queryKey: ["wallEntries"] });
    toast.success(`Duplicated as ${newCode}`);
  };

  const handleEditWall = async (data) => {
    if (editingWall._custom) {
      await WallEntry.update(editingWall._id, {
        ...data,
        groupKey: editingWall._groupKey,
        originalCode: editingWall.originalCode || undefined,
      });
    } else {
      // Check if there's already a custom override for this built-in
      const existingOverride = customWalls.find(c => c.originalCode === editingWall.code);
      if (existingOverride) {
        // Update the existing override
        await WallEntry.update(existingOverride.id, {
          ...data,
          groupKey: editingWall._groupKey,
          originalCode: editingWall.code,
        });
      } else {
        // First time editing this built-in: hide it and create override
        await Promise.all([
          DeletedWall.create({ wallCode: editingWall.code }),
          WallEntry.create({
            ...data,
            groupKey: editingWall._groupKey,
            originalCode: editingWall.code,
          }),
        ]);
      }
    }
    await Promise.all([
      queryClient.refetchQueries({ queryKey: ["wallEntries"] }),
      queryClient.refetchQueries({ queryKey: ["deletedWalls"] }),
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
    try {
      const fileName = `walls/${pendingUploadCode}-${Date.now()}.${file.name.split('.').pop()}`;
      const file_url = await Storage.uploadFile('images', fileName, file);
      const existing = await WallImage.filter({ wall_type: pendingUploadCode });
      if (existing.length > 0) {
        await WallImage.update(existing[0].id, { image_url: file_url });
      } else {
        await WallImage.create({ wall_type: pendingUploadCode, image_url: file_url });
      }
      queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      toast.success("Image updated");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload image");
    }
    setUploading(null);
  };

  const handleRemoveImage = async (code) => {
    const existing = await WallImage.filter({ wall_type: code });
    if (existing.length > 0) {
      await WallImage.delete(existing[0].id);
      queryClient.invalidateQueries({ queryKey: ["wallImages"] });
      toast.success("Image removed");
    }
  };

  // Deleted codes that have a custom override (stored via originalCode field)
  const overriddenCodes = new Set(customWalls.filter(c => c.originalCode).map(c => c.originalCode));

  // Helper: extract the primary series number from a wall code for sorting.
  // For codes like "W003", "WS003/YS003", "WY-W-003" — use the LAST numeric block
  // before any space or parenthesis, which is most reliably the series number.
  const codeNum = (code) => {
    const str = String(code).split(/[\s(]/)[0]; // take only the part before spaces/parens
    const all = [...str.matchAll(/\d+/g)];
    if (all.length === 0) return 9999;
    // Use the last number found in the primary code segment
    return parseInt(all[all.length - 1][0], 10);
  };

  // Merge hardcoded + custom entries per group, filtering out deleted built-ins
  const allGroups = WALL_GROUPS.map(g => {
    const builtins = g.walls
      .filter(w => {
        if (overriddenCodes.has(w.code)) return false;
        return !deletedCodes.has(w.code);
      })
      .map(w => ({ ...w, _custom: false, _deleted: false, _groupKey: g.key }));

    const customs = customWalls.filter(c => c.groupKey === g.key).map(c => ({
      code: c.code, name: c.name, width: c.width || 3000,
      description: c.description || "", variants: c.variants || [],
      windowStyle: c.windowStyle || undefined,
      openingPanes: c.openingPanes != null ? c.openingPanes : undefined,
      windowHeight: c.windowHeight != null ? c.windowHeight : undefined,
      windowWidth: c.windowWidth != null ? c.windowWidth : undefined,
      doorStyle: c.doorStyle || null,
      doorHeight: c.doorHeight != null ? c.doorHeight : undefined,
      doorWidth: c.doorWidth != null ? c.doorWidth : undefined,
      price: c.price != null ? c.price : undefined,
      originalCode: c.originalCode || undefined,
      _custom: true, _id: c.id, _deleted: false, _groupKey: g.key,
    }));

    const merged = [...builtins, ...customs];
    merged.sort((a, b) => {
      if (a.width !== b.width) return a.width - b.width;
      // For custom entries, always sort by their own code (e.g. WY-W-003)
      // For built-ins, sort by their code
      return codeNum(a.code) - codeNum(b.code);
    });

    return { ...g, walls: merged };
  });

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

  if (printMode) {
    const printCategories = filtered.map(group => ({
      name: group.label,
      description: `Series: ${group.series}`,
      items: group.walls.map(w => ({
        code: w.code,
        name: w.name,
        specs: `${(w.width / 1000).toFixed(1)}m`,
        description: w.description || "—",
        variants: w.variants || [],
        imageUrl: wallImages[w.code] || wallImages[w.originalCode] || null,
      })),
    }));

    return (
      <PrintableCatalogue
        title="Wall Catalogue"
        categories={printCategories}
        onClose={() => setPrintMode(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <div className="shrink-0 flex items-center gap-3">
            <img src="https://media.base44.com/images/public/69a55c0c222e61cb3fbc417c/1a43e85d2_Connectapod-01.png" alt="connectapod" className="h-8 w-auto" />
            <span className="text-xs text-gray-400">Wall Catalogue</span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setPrintMode(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all"
              title="Print catalogue as PDF"
            >
              <Printer size={14} />
              Print
            </button>
            <button
              onClick={() => setEditMode(e => !e)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs border transition-all ${editMode ? "bg-[#F15A22] text-white border-[#F15A22]" : "text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              <Pencil size={13} />
              {editMode ? "Done Editing" : "Edit Catalogue"}
            </button>
            <Link to="/Configurator" className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22] transition-all">
              <ChevronLeft size={16} />
              Exit
            </Link>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-0">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search by code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#F15A22]"
          />
          <div className="flex items-center gap-2 text-sm text-gray-500 bg-white border border-gray-200 px-4 py-2.5">
            <span className="font-bold text-gray-800">{totalWalls}</span> wall panels across
            <span className="font-bold text-gray-800">{WALL_GROUPS.length}</span> series
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveGroup("all")}
            className={`px-3 py-1.5 text-xs font-medium border transition-all ${activeGroup === "all" ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
          >
            All Series
          </button>
          {WALL_GROUPS.map(g => (
            <button
              key={g.key}
              onClick={() => setActiveGroup(g.key)}
              className={`px-3 py-1.5 text-xs font-medium border transition-all ${activeGroup === g.key ? "bg-[#F15A22] text-white border-[#F15A22]" : "bg-white text-gray-600 border-gray-200 hover:border-[#F15A22] hover:text-[#F15A22]"}`}
            >
              {g.label.split("–")[0].trim()}
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
          existingWalls={customWalls}
        />
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-8 space-y-10">
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
                    {editMode && !wall._deleted && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDuplicateWall(wall, group.key)}
                          className="text-gray-300 hover:text-blue-500 transition-colors"
                          title="Duplicate wall"
                        >
                          <Copy size={13} />
                        </button>
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
                    )}
                  </div>

                  {/* Wall image */}
                   <div className="w-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3 relative" style={{ height: "240px" }}>
                     {uploading === wall.code ? (
                       <Loader2 size={20} className="animate-spin text-[#F15A22]" />
                     ) : (wallImages[wall.code] || wallImages[wall.originalCode]) ? (
                       <>
                         <img src={wallImages[wall.code] || wallImages[wall.originalCode]} alt={wall.name} className="w-auto h-full object-contain" style={{ backgroundColor: 'white' }} />
                         {wallImages[wall.code] && (
                           <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                             <span>✓</span> Matched
                           </div>
                         )}
                         {!wallImages[wall.code] && wallImages[wall.originalCode] && (
                           <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1" title="Using original code image">
                             <span>⚠</span> Original
                           </div>
                         )}
                       </>
                     ) : (
                       <div
                         className="bg-white border border-gray-300"
                         style={{ width: `${(wall.width / 3000) * 60}%`, height: "80%" }}
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
                        {(wallImages[wall.code] || wallImages[wall.originalCode]) && (
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
                  {(wall.windowStyle || wall.openingPanes != null || wall.windowHeight != null || wall.windowWidth != null || wall.doorStyle || wall.doorHeight != null || wall.doorWidth != null || wall.price != null) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-[10px] text-gray-500 border-t border-gray-100 pt-2">
                      {(() => {
                        const descParts = (wall.description || "").split(",").map(s => s.trim()).filter(Boolean);
                        const hasWindow = descParts.includes("Window");
                        const hasDoor = descParts.includes("Door");
                        return (
                          <>
                            {hasWindow && (wall.windowHeight != null || wall.windowWidth != null) && (
                              <span><span className="font-semibold text-gray-700">Window:</span> {wall.windowWidth ?? "—"}×{wall.windowHeight ?? "—"}mm</span>
                            )}
                            {hasWindow && wall.windowStyle && <span><span className="font-semibold text-gray-700">Style:</span> {wall.windowStyle}</span>}
                            {hasWindow && wall.openingPanes != null && <span><span className="font-semibold text-gray-700">Panes:</span> {wall.openingPanes}</span>}
                            {hasDoor && (wall.doorHeight != null || wall.doorWidth != null) && (
                              <span><span className="font-semibold text-gray-700">Door:</span> {wall.doorWidth ?? "—"}×{wall.doorHeight ?? "—"}mm</span>
                            )}
                            {hasDoor && wall.doorStyle && <span><span className="font-semibold text-gray-700">Door Style:</span> {wall.doorStyle}</span>}
                            {wall.price != null && <span><span className="font-semibold text-gray-700">Price:</span> ${wall.price.toLocaleString()}</span>}
                          </>
                        );
                      })()}
                    </div>
                  )}

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
        © {new Date().getFullYear()} connectapod. All rights reserved. · {totalWalls} wall panels across {WALL_GROUPS.length} series
      </div>
    </div>
  );
}
