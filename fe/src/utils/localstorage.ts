/*
 * @Date: 2025-11-29 11:24:04
 * @LastEditors: CZH
 * @LastEditTime: 2025-11-29 11:24:29
 * @FilePath: /打卡/fe/src/utils/localstorage.ts
 */
/**
 * LocalStorage 管理工具
 * 用于存储和读取用户签到信息
 */

// 存储的键名
const CHECKIN_USER_INFO_KEY = 'checkin_user_info'

// 用户信息接口
export interface UserInfo {
  realName: string
  phone: string
  lastCheckinTime?: string
}

/**
 * 保存用户信息到localStorage
 * @param userInfo 用户信息
 */
export const saveUserInfo = (userInfo: UserInfo): void => {
  try {
    const data = {
      ...userInfo,
      savedAt: new Date().toISOString()
    }
    localStorage.setItem(CHECKIN_USER_INFO_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存用户信息到localStorage失败:', error)
  }
}

/**
 * 从localStorage读取用户信息
 * @returns 用户信息，如果不存在则返回null
 */
export const getUserInfo = (): UserInfo | null => {
  try {
    const data = localStorage.getItem(CHECKIN_USER_INFO_KEY)
    if (!data) {
      return null
    }
    
    const parsedData = JSON.parse(data)
    // 只返回用户信息，不返回保存时间
    const { savedAt, ...userInfo } = parsedData
    return userInfo
  } catch (error) {
    console.error('从localStorage读取用户信息失败:', error)
    return null
  }
}

/**
 * 清除localStorage中的用户信息
 */
export const clearUserInfo = (): void => {
  try {
    localStorage.removeItem(CHECKIN_USER_INFO_KEY)
  } catch (error) {
    console.error('清除localStorage用户信息失败:', error)
  }
}

/**
 * 检查localStorage中是否有用户信息
 * @returns 是否存在用户信息
 */
export const hasUserInfo = (): boolean => {
  return getUserInfo() !== null
}
