/**
 * ConnectaPod Module Definitions
 * 
 * These are the standard module entries that can be seeded into the database.
 * Module code format: [Category Prefix][Width Code][Depth Code][Chassis Type]
 * 
 * Width codes: 15 = 1.5m, 18 = 1.8m, 24 = 2.4m, 30 = 3.0m
 * Depth codes: 24 = 2.4m, 48 = 4.8m
 * Chassis types: C = Center, EF = End Front, ER = End Rear
 */

export const SEED_MODULES = [
  // ========== LIVING MODULES ==========
  {
    category: "Living",
    code: "LV1524C",
    name: "Living 1.5m Center",
    width: 1.5,
    depth: 2.4,
    description: "Compact living module, center chassis",
    price: 12000,
    chassis: "C",
    widthCode: "15",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV1824C",
    name: "Living 1.8m Center",
    width: 1.8,
    depth: 2.4,
    description: "Standard living module, center chassis",
    price: 14000,
    chassis: "C",
    widthCode: "18",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV2424C",
    name: "Living 2.4m Center",
    width: 2.4,
    depth: 2.4,
    description: "Medium living module, center chassis",
    price: 16000,
    chassis: "C",
    widthCode: "24",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV3024C",
    name: "Living 3.0m Center",
    width: 3.0,
    depth: 2.4,
    description: "Large living module, center chassis",
    price: 18000,
    chassis: "C",
    widthCode: "30",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV1548C",
    name: "Living 1.5m Deep Center",
    width: 1.5,
    depth: 4.8,
    description: "Compact deep living module, center chassis",
    price: 22000,
    chassis: "C",
    widthCode: "15",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV1848C",
    name: "Living 1.8m Deep Center",
    width: 1.8,
    depth: 4.8,
    description: "Standard deep living module, center chassis",
    price: 26000,
    chassis: "C",
    widthCode: "18",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV2448C",
    name: "Living 2.4m Deep Center",
    width: 2.4,
    depth: 4.8,
    description: "Medium deep living module, center chassis",
    price: 30000,
    chassis: "C",
    widthCode: "24",
    room: "Living"
  },
  {
    category: "Living",
    code: "LV3048C",
    name: "Living 3.0m Deep Center",
    width: 3.0,
    depth: 4.8,
    description: "Large deep living module, center chassis",
    price: 34000,
    chassis: "C",
    widthCode: "30",
    room: "Living"
  },

  // ========== BEDROOM MODULES ==========
  {
    category: "Bedroom",
    code: "BR1524EF",
    name: "Bedroom 1.5m End Front",
    width: 1.5,
    depth: 2.4,
    description: "Compact bedroom, end front configuration",
    price: 14000,
    chassis: "EF",
    widthCode: "15",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR1824EF",
    name: "Bedroom 1.8m End Front",
    width: 1.8,
    depth: 2.4,
    description: "Standard bedroom, end front configuration",
    price: 16000,
    chassis: "EF",
    widthCode: "18",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR2424EF",
    name: "Bedroom 2.4m End Front",
    width: 2.4,
    depth: 2.4,
    description: "Medium bedroom, end front configuration",
    price: 18000,
    chassis: "EF",
    widthCode: "24",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR3024EF",
    name: "Bedroom 3.0m End Front",
    width: 3.0,
    depth: 2.4,
    description: "Large bedroom, end front configuration",
    price: 20000,
    chassis: "EF",
    widthCode: "30",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR1548EF",
    name: "Bedroom 1.5m Deep End Front",
    width: 1.5,
    depth: 4.8,
    description: "Compact deep bedroom, end front configuration",
    price: 26000,
    chassis: "EF",
    widthCode: "15",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR1848EF",
    name: "Bedroom 1.8m Deep End Front",
    width: 1.8,
    depth: 4.8,
    description: "Standard deep bedroom, end front configuration",
    price: 30000,
    chassis: "EF",
    widthCode: "18",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR2448EF",
    name: "Bedroom 2.4m Deep End Front",
    width: 2.4,
    depth: 4.8,
    description: "Medium deep bedroom, end front configuration",
    price: 34000,
    chassis: "EF",
    widthCode: "24",
    room: "Bedroom"
  },
  {
    category: "Bedroom",
    code: "BR3048EF",
    name: "Bedroom 3.0m Deep End Front",
    width: 3.0,
    depth: 4.8,
    description: "Large deep bedroom, end front configuration",
    price: 38000,
    chassis: "EF",
    widthCode: "30",
    room: "Bedroom"
  },

  // ========== BATHROOM MODULES ==========
  {
    category: "Bathroom",
    code: "BT1524C",
    name: "Bathroom 1.5m Center",
    width: 1.5,
    depth: 2.4,
    description: "Compact bathroom with shower, vanity, toilet",
    price: 18000,
    chassis: "C",
    widthCode: "15",
    room: "Bathroom"
  },
  {
    category: "Bathroom",
    code: "BT1824C",
    name: "Bathroom 1.8m Center",
    width: 1.8,
    depth: 2.4,
    description: "Standard bathroom with shower, vanity, toilet",
    price: 20000,
    chassis: "C",
    widthCode: "18",
    room: "Bathroom"
  },
  {
    category: "Bathroom",
    code: "BT2424C",
    name: "Bathroom 2.4m Center",
    width: 2.4,
    depth: 2.4,
    description: "Medium bathroom with shower, vanity, toilet",
    price: 22000,
    chassis: "C",
    widthCode: "24",
    room: "Bathroom"
  },
  {
    category: "Bathroom",
    code: "BT1548C",
    name: "Bathroom 1.5m Deep Center",
    width: 1.5,
    depth: 4.8,
    description: "Compact deep bathroom with full amenities",
    price: 32000,
    chassis: "C",
    widthCode: "15",
    room: "Bathroom"
  },
  {
    category: "Bathroom",
    code: "BT1848C",
    name: "Bathroom 1.8m Deep Center",
    width: 1.8,
    depth: 4.8,
    description: "Standard deep bathroom with full amenities",
    price: 36000,
    chassis: "C",
    widthCode: "18",
    room: "Bathroom"
  },
  {
    category: "Bathroom",
    code: "BT2448C",
    name: "Bathroom 2.4m Deep Center",
    width: 2.4,
    depth: 4.8,
    description: "Large deep bathroom with full amenities",
    price: 40000,
    chassis: "C",
    widthCode: "24",
    room: "Bathroom"
  },

  // ========== LAUNDRY MODULES ==========
  {
    category: "Laundry",
    code: "LY1524C",
    name: "Laundry 1.5m Center",
    width: 1.5,
    depth: 2.4,
    description: "Compact laundry module",
    price: 14000,
    chassis: "C",
    widthCode: "15",
    room: "Laundry"
  },
  {
    category: "Laundry",
    code: "LY1824C",
    name: "Laundry 1.8m Center",
    width: 1.8,
    depth: 2.4,
    description: "Standard laundry module",
    price: 16000,
    chassis: "C",
    widthCode: "18",
    room: "Laundry"
  },
  {
    category: "Laundry",
    code: "LY2424C",
    name: "Laundry 2.4m Center",
    width: 2.4,
    depth: 2.4,
    description: "Large laundry module",
    price: 18000,
    chassis: "C",
    widthCode: "24",
    room: "Laundry"
  },
  {
    category: "Laundry",
    code: "LY1548C",
    name: "Laundry 1.5m Deep Center",
    width: 1.5,
    depth: 4.8,
    description: "Compact deep laundry module with extra storage",
    price: 26000,
    chassis: "C",
    widthCode: "15",
    room: "Laundry"
  },
  {
    category: "Laundry",
    code: "LY1848C",
    name: "Laundry 1.8m Deep Center",
    width: 1.8,
    depth: 4.8,
    description: "Standard deep laundry module with extra storage",
    price: 30000,
    chassis: "C",
    widthCode: "18",
    room: "Laundry"
  },

  // ========== KITCHEN MODULES ==========
  {
    category: "Kitchen",
    code: "KT1824EF",
    name: "Kitchen 1.8m End Front",
    width: 1.8,
    depth: 2.4,
    description: "Compact kitchen with sink and cooktop",
    price: 24000,
    chassis: "EF",
    widthCode: "18",
    room: "Kitchen"
  },
  {
    category: "Kitchen",
    code: "KT2424EF",
    name: "Kitchen 2.4m End Front",
    width: 2.4,
    depth: 2.4,
    description: "Standard kitchen with full cabinetry",
    price: 28000,
    chassis: "EF",
    widthCode: "24",
    room: "Kitchen"
  },
  {
    category: "Kitchen",
    code: "KT3024EF",
    name: "Kitchen 3.0m End Front",
    width: 3.0,
    depth: 2.4,
    description: "Large kitchen with island prep space",
    price: 32000,
    chassis: "EF",
    widthCode: "30",
    room: "Kitchen"
  },
  {
    category: "Kitchen",
    code: "KT1848EF",
    name: "Kitchen 1.8m Deep End Front",
    width: 1.8,
    depth: 4.8,
    description: "Compact deep kitchen with pantry storage",
    price: 42000,
    chassis: "EF",
    widthCode: "18",
    room: "Kitchen"
  },
  {
    category: "Kitchen",
    code: "KT2448EF",
    name: "Kitchen 2.4m Deep End Front",
    width: 2.4,
    depth: 4.8,
    description: "Standard deep kitchen with island and pantry",
    price: 48000,
    chassis: "EF",
    widthCode: "24",
    room: "Kitchen"
  },
  {
    category: "Kitchen",
    code: "KT3048EF",
    name: "Kitchen 3.0m Deep End Front",
    width: 3.0,
    depth: 4.8,
    description: "Large deep kitchen with full amenities",
    price: 54000,
    chassis: "EF",
    widthCode: "30",
    room: "Kitchen"
  },

  // ========== CONNECTION MODULES ==========
  {
    category: "Connection",
    code: "CN1524C",
    name: "Connection 1.5m Center",
    width: 1.5,
    depth: 2.4,
    description: "Narrow connection module",
    price: 16000,
    chassis: "C",
    widthCode: "15",
    room: "Connection"
  },
  {
    category: "Connection",
    code: "CN1824C",
    name: "Connection 1.8m Center",
    width: 1.8,
    depth: 2.4,
    description: "Standard connection module",
    price: 18000,
    chassis: "C",
    widthCode: "18",
    room: "Connection"
  },
  {
    category: "Connection",
    code: "CN2424C",
    name: "Connection 2.4m Center",
    width: 2.4,
    depth: 2.4,
    description: "Wide connection module",
    price: 20000,
    chassis: "C",
    widthCode: "24",
    room: "Connection"
  },
  {
    category: "Connection",
    code: "CN3024C",
    name: "Connection 3.0m Center",
    width: 3.0,
    depth: 2.4,
    description: "Extra wide connection module",
    price: 22000,
    chassis: "C",
    widthCode: "30",
    room: "Connection"
  },

  // ========== SOFFIT MODULES ==========
  {
    category: "Soffit",
    code: "SF1524EF",
    name: "Soffit 1.5m End Front",
    width: 1.5,
    depth: 2.4,
    description: "Covered soffit, end front configuration",
    price: 6000,
    chassis: "EF",
    widthCode: "15",
    room: "Soffit"
  },
  {
    category: "Soffit",
    code: "SF1824EF",
    name: "Soffit 1.8m End Front",
    width: 1.8,
    depth: 2.4,
    description: "Covered soffit, end front configuration",
    price: 7000,
    chassis: "EF",
    widthCode: "18",
    room: "Soffit"
  },
  {
    category: "Soffit",
    code: "SF2424EF",
    name: "Soffit 2.4m End Front",
    width: 2.4,
    depth: 2.4,
    description: "Covered soffit, end front configuration",
    price: 8000,
    chassis: "EF",
    widthCode: "24",
    room: "Soffit"
  },
  {
    category: "Soffit",
    code: "SF3024EF",
    name: "Soffit 3.0m End Front",
    width: 3.0,
    depth: 2.4,
    description: "Covered soffit, end front configuration",
    price: 9000,
    chassis: "EF",
    widthCode: "30",
    room: "Soffit"
  },

  // ========== DECK MODULES ==========
  {
    category: "Deck",
    code: "DK1524EF",
    name: "Deck 1.5m End Front",
    width: 1.5,
    depth: 2.4,
    description: "Outdoor deck, end front configuration",
    price: 8000,
    chassis: "EF",
    widthCode: "15",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK1824EF",
    name: "Deck 1.8m End Front",
    width: 1.8,
    depth: 2.4,
    description: "Outdoor deck, end front configuration",
    price: 9000,
    chassis: "EF",
    widthCode: "18",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK2424EF",
    name: "Deck 2.4m End Front",
    width: 2.4,
    depth: 2.4,
    description: "Outdoor deck, end front configuration",
    price: 10000,
    chassis: "EF",
    widthCode: "24",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK3024EF",
    name: "Deck 3.0m End Front",
    width: 3.0,
    depth: 2.4,
    description: "Outdoor deck, end front configuration",
    price: 11000,
    chassis: "EF",
    widthCode: "30",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK1548EF",
    name: "Deck 1.5m Deep End Front",
    width: 1.5,
    depth: 4.8,
    description: "Deep outdoor deck, end front configuration",
    price: 14000,
    chassis: "EF",
    widthCode: "15",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK1848EF",
    name: "Deck 1.8m Deep End Front",
    width: 1.8,
    depth: 4.8,
    description: "Deep outdoor deck, end front configuration",
    price: 16000,
    chassis: "EF",
    widthCode: "18",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK2448EF",
    name: "Deck 2.4m Deep End Front",
    width: 2.4,
    depth: 4.8,
    description: "Deep outdoor deck, end front configuration",
    price: 18000,
    chassis: "EF",
    widthCode: "24",
    room: "Deck"
  },
  {
    category: "Deck",
    code: "DK3048EF",
    name: "Deck 3.0m Deep End Front",
    width: 3.0,
    depth: 4.8,
    description: "Deep outdoor deck, end front configuration",
    price: 20000,
    chassis: "EF",
    widthCode: "30",
    room: "Deck"
  },
];
