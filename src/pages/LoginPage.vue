<template>
  <main class="login-page">
    <section class="login-panel">
      <div class="login-brand">
        <span class="brand-mark">Y</span>
        <div>
          <strong>药网 ERP</strong>
          <span>后台管理系统</span>
        </div>
      </div>

      <el-tabs v-model="activeTab" stretch>
        <el-tab-pane label="账号登录" name="login">
          <el-form class="login-form" :model="loginForm" label-position="top" @submit.prevent>
            <el-form-item label="账号" required>
              <el-input
                v-model.trim="loginForm.account"
                autocomplete="username"
                placeholder="请输入账号"
                @keyup.enter="submitLogin"
              />
            </el-form-item>
            <el-form-item label="密码" required>
              <el-input
                v-model.trim="loginForm.password"
                autocomplete="current-password"
                placeholder="请输入密码"
                show-password
                type="password"
                @keyup.enter="submitLogin"
              />
            </el-form-item>
            <el-button
              class="login-submit"
              type="primary"
              :loading="loginLoading"
              @click="submitLogin"
            >
              登录
            </el-button>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="重置密码" name="reset">
          <el-form class="login-form" :model="resetForm" label-position="top" @submit.prevent>
            <el-form-item label="目标账号" required>
              <el-input
                v-model.trim="resetForm.account"
                placeholder="请输入需要重置的账号"
                @keyup.enter="submitResetPassword"
              />
            </el-form-item>
            <el-form-item label="新密码" required>
              <el-input
                v-model.trim="resetForm.newPassword"
                autocomplete="new-password"
                placeholder="请输入新密码"
                show-password
                type="password"
                @keyup.enter="submitResetPassword"
              />
            </el-form-item>
            <el-form-item label="确认密码" required>
              <el-input
                v-model.trim="resetForm.confirmPassword"
                autocomplete="new-password"
                placeholder="请再次输入新密码"
                show-password
                type="password"
                @keyup.enter="submitResetPassword"
              />
            </el-form-item>
            <el-button
              class="login-submit"
              type="primary"
              :loading="resetLoading"
              @click="submitResetPassword"
            >
              重置密码
            </el-button>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi, setAuthSession } from '../api/wms'

const emit = defineEmits(['login-success'])

const activeTab = ref('login')
const loginLoading = ref(false)
const resetLoading = ref(false)
const loginForm = reactive({
  account: '',
  password: ''
})
const resetForm = reactive({
  account: '',
  newPassword: '',
  confirmPassword: ''
})

async function submitLogin() {
  if (!loginForm.account || !loginForm.password) {
    ElMessage.warning('请填写账号和密码')
    return
  }

  loginLoading.value = true
  try {
    const session = await authApi.login({
      account: loginForm.account,
      password: loginForm.password
    })
    if (!session?.token) {
      throw new Error('登录响应缺少 token')
    }
    setAuthSession(session)
    ElMessage.success('登录成功')
    emit('login-success', session)
  } catch (error) {
    ElMessage.error(error.message || '登录失败')
  } finally {
    loginLoading.value = false
  }
}

async function submitResetPassword() {
  if (!resetForm.account || !resetForm.newPassword) {
    ElMessage.warning('请填写账号和新密码')
    return
  }
  if (resetForm.newPassword !== resetForm.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  resetLoading.value = true
  try {
    await authApi.resetPassword({
      account: resetForm.account,
      newPassword: resetForm.newPassword
    })
    ElMessage.success('密码已重置，请使用新密码登录')
    loginForm.account = resetForm.account
    loginForm.password = ''
    resetForm.newPassword = ''
    resetForm.confirmPassword = ''
    activeTab.value = 'login'
  } catch (error) {
    ElMessage.error(error.message || '重置密码失败')
  } finally {
    resetLoading.value = false
  }
}
</script>
