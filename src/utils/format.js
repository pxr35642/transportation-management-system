/**
 * 格式化日期時間
 * 後端回傳格式：2026-03-05T10:00:07.8532568
 * 轉換後顯示：2026-03-05 10:00:07
 * @param {string} dateStr - 後端回傳的 ISO 日期字串
 * @param {boolean} showTime - 是否顯示時間，預設 true
 */
export const formatDate = (dateStr, showTime = true) => {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  // 檢查是否為有效日期
  if (isNaN(date.getTime())) return "-";

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");

  return showTime ? `${yyyy}-${MM}-${dd} ${HH}:${mm}:${ss}` : `${yyyy}-${MM}-${dd}`;
};

/**
 * 格式化訂單狀態
 * @param {number} status
 */
export const formatOrderStatus = (status) => {
  const map = { 0: "待派車", 1: "運送中", 2: "已完成", 3: "已取消" };
  return map[status] ?? "未知";
};

/**
 * 格式化車輛狀態
 * @param {number} status
 */
export const formatVehicleStatus = (status) => {
  const map = { 0: "可用", 1: "運送中", 2: "維修中" };
  return map[status] ?? "未知";
};

/**
 * 格式化司機狀態
 * @param {number} status
 */
export const formatDriverStatus = (status) => {
  const map = { 0: "在職", 1: "休假", 2: "離職" };
  return map[status] ?? "未知";
};
