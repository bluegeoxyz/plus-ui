<template>
  <div class="login">
    <div class="login-shell">
      <section class="login-brand">
        <div class="brand-heading">
          <img :src="brandLogo" class="brand-logo" alt="景道" />
          <div>
            <span class="brand-pill">JINGDAO PROPERTY</span>
            <h1 class="brand-title">景道物业管理平台</h1>
            <p class="brand-desc">智慧物业 · 高效运营</p>
          </div>
        </div>
        <div class="brand-message">
          <strong>让物业服务更智慧，让运营管理更清晰</strong>
          <span>连接项目、房屋、住户、收费与仓储业务，构建统一的企业级物业管理工作台。</span>
        </div>
      </section>

      <el-form ref="loginRef" :model="loginForm" :rules="loginRules" class="login-form">
        <div class="title-box">
          <div>
            <div class="mobile-brand">
              <img :src="brandLogo" alt="景道" />
              <span>景道物业</span>
            </div>
            <p class="eyebrow">WELCOME BACK</p>
            <h3 class="title">{{ title }}</h3>
            <p class="subtitle">登录您的账户，进入智慧物业工作台</p>
          </div>
          <lang-select />
        </div>

        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            type="text"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.username')"
          >
            <template #prefix><svg-icon icon-class="user" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.password')"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="password" class="el-input__icon input-icon" /></template>
          </el-input>
        </el-form-item>

        <el-form-item v-if="captchaEnabled" prop="code" class="captcha-row">
          <el-input
            v-model="loginForm.code"
            size="large"
            auto-complete="off"
            :placeholder="$t('login.code')"
            @keyup.enter="handleLogin"
          >
            <template #prefix><svg-icon icon-class="validCode" class="el-input__icon input-icon" /></template>
          </el-input>
          <div class="login-code">
            <img :src="codeUrl" class="login-code-img" @click="getCode" />
          </div>
        </el-form-item>

        <div class="form-meta">
          <el-checkbox v-model="loginForm.rememberMe">{{ $t('login.rememberPassword') }}</el-checkbox>
        </div>

        <el-form-item class="submit-row">
          <el-button :loading="loading" size="large" type="primary" class="submit-button" @click.prevent="handleLogin">
            <span v-if="!loading">{{ $t('login.login') }}</span>
            <span v-else>{{ $t('login.logging') }}</span>
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="el-login-footer">
      <span>© 景道 · 物业管理平台</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { to } from 'await-to-js';
import { useI18n } from 'vue-i18n';
import { getCodeImg } from '@/api/login';
import { LoginData } from '@/api/types';
import { useUserStore } from '@/store/modules/user';
import brandLogo from '@/assets/brand/logo.png';

const title = import.meta.env.VITE_APP_TITLE;
const userStore = useUserStore();
const router = useRouter();
const { t } = useI18n();

const loginForm = ref<LoginData>({
  username: '',
  password: '',
  rememberMe: false,
  code: '',
  uuid: ''
} as LoginData);

const loginRules: ElFormRules = {
  username: [
    {
      required: true,
      trigger: 'blur',
      message: t('login.rule.username.required')
    }
  ],
  password: [
    {
      required: true,
      trigger: 'blur',
      message: t('login.rule.password.required')
    }
  ],
  code: [
    {
      required: true,
      trigger: 'change',
      message: t('login.rule.code.required')
    }
  ]
};

const codeUrl = ref('');
const loading = ref(false);
const captchaEnabled = ref(true);
const redirect = ref('/');
const loginRef = ref<ElFormInstance>();

watch(
  () => router.currentRoute.value,
  (newRoute: any) => {
    redirect.value = newRoute.query && newRoute.query.redirect && decodeURIComponent(newRoute.query.redirect);
  },
  { immediate: true }
);

const handleLogin = () => {
  if (loading.value) return;
  loginRef.value?.validate(async (valid: boolean) => {
    if (valid) {
      loading.value = true;
      if (loginForm.value.rememberMe) {
        localStorage.setItem('username', String(loginForm.value.username));
        localStorage.setItem('rememberMe', String(loginForm.value.rememberMe));
      } else {
        localStorage.removeItem('username');
        localStorage.removeItem('rememberMe');
      }
      localStorage.removeItem('password');
      const [err] = await to(userStore.login(loginForm.value));
      if (!err) {
        const redirectUrl = redirect.value || '/';
        await router.push(redirectUrl);
        loading.value = false;
      } else {
        loading.value = false;
        if (captchaEnabled.value) {
          await getCode();
        }
      }
    }
  });
};

const getCode = async () => {
  const res = await getCodeImg();
  const { data } = res;
  captchaEnabled.value = data.captchaEnabled === undefined ? true : data.captchaEnabled;
  if (captchaEnabled.value) {
    loginForm.value.code = '';
    codeUrl.value = 'data:image/gif;base64,' + data.img;
    loginForm.value.uuid = data.uuid;
  }
};

const getLoginData = () => {
  const username = localStorage.getItem('username');
  const rememberMe = localStorage.getItem('rememberMe');
  localStorage.removeItem('password');
  loginForm.value = {
    username: username === null ? String(loginForm.value.username) : username,
    password: username === null ? String(loginForm.value.password) : '',
    rememberMe: rememberMe === 'true'
  } as LoginData;
};

onMounted(() => {
  getCode();
  getLoginData();
});
</script>

<style lang="scss" scoped>
.login {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 88px;
  background:
    linear-gradient(110deg, rgba(245, 250, 255, 0.96), rgba(235, 247, 255, 0.9)),
    url('@/assets/brand/background.png') center / cover no-repeat;
}

.login-shell {
  width: min(1180px, 100%);
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(360px, 440px);
  gap: 26px;
  align-items: stretch;
}

.login-brand,
.login-form {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 28px 72px rgba(23, 52, 92, 0.18);
  backdrop-filter: blur(18px);
}

.login-brand {
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 590px;
  color: #fff;
  background:
    linear-gradient(110deg, rgba(6, 70, 155, 0.9) 0%, rgba(22, 119, 255, 0.58) 46%, rgba(32, 201, 210, 0.08) 100%),
    url('@/assets/brand/background.png') center / cover no-repeat;
  overflow: hidden;
}

.brand-heading {
  display: flex;
  align-items: center;
  gap: 22px;
}

.brand-logo {
  width: 96px;
  height: 72px;
  object-fit: contain;
  filter: drop-shadow(0 14px 24px rgba(2, 35, 88, 0.24));
}

.brand-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand-title {
  margin: 16px 0 10px;
  font-size: clamp(34px, 4vw, 50px);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.brand-desc {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 18px;
  letter-spacing: 0.12em;
}

.brand-message {
  width: min(540px, 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 22px 24px;
  border-radius: 18px;
  background: rgba(4, 43, 102, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.2);

  strong {
    font-size: 18px;
  }

  span {
    color: rgba(255, 255, 255, 0.78);
    font-size: 14px;
    line-height: 1.7;
  }
}

.brand-highlights {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 28px 0 34px;
}

.highlight-chip {
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f8fbff;
  font-size: 13px;
}

.brand-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.metric-card {
  padding: 18px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    font-size: 24px;
    color: #fff;
  }

  span {
    color: rgba(226, 232, 240, 0.72);
    font-size: 13px;
  }
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 42px 34px 30px;
  z-index: 1;
  background: var(--app-surface-bg);
}

.mobile-brand {
  display: none;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  color: var(--app-text-title);
  font-weight: 700;

  img {
    width: 42px;
    height: 34px;
    object-fit: contain;
  }
}

.title-box {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 28px;

  .eyebrow {
    margin: 0 0 8px;
    color: var(--app-accent-strong);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .title {
    margin: 0;
    color: var(--app-text-title);
    font-weight: 700;
    font-size: 30px;
    letter-spacing: -0.03em;
  }

  .subtitle {
    margin: 8px 0 0;
    color: var(--app-text-muted);
    font-size: 14px;
    line-height: 1.7;
  }

  :deep(.lang-select--style) {
    line-height: 0;
    color: var(--app-text-muted);
    padding: 10px;
    border-radius: 14px;
    background: var(--app-elevated-soft-bg);
    border: 1px solid var(--app-surface-border);
  }
}

.login-form .el-input {
  height: 48px;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form .input-icon {
  height: 46px;
  width: 14px;
  margin-left: 0;
}

.captcha-row {
  :deep(.el-form-item__content) {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 122px;
    gap: 12px;
  }
}

.form-meta {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  margin: -2px 0 22px;
}

.submit-row {
  margin-bottom: 0 !important;
}

.submit-button {
  width: 100%;
  height: 50px;
  border-radius: 16px;
  background: linear-gradient(135deg, #1677ff, #20c9d2);
  border: none;
  box-shadow: 0 18px 34px rgba(22, 119, 255, 0.22);
}

.login-form :deep(.el-input__wrapper) {
  min-height: 48px;
  background-color: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 0 0 1px var(--app-surface-border) inset;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px rgba(53, 109, 255, 0.24) inset,
    0 0 0 4px rgba(53, 109, 255, 0.12);
}

.login-form :deep(.el-checkbox__label) {
  color: var(--app-text-muted);
}

.login-code {
  height: 48px;
  box-sizing: border-box;
  border-radius: 16px;
  overflow: hidden;
  background: var(--el-bg-color);
  border: 1px solid var(--app-surface-border);

  img {
    cursor: pointer;
    vertical-align: middle;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.el-login-footer {
  height: 40px;
  line-height: 40px;
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  letter-spacing: 0.08em;
}

.login-code-img {
  height: 48px;
  padding-left: 0;
}

@media (max-width: 960px) {
  .login {
    padding: 24px 14px 80px;
  }

  .login-shell {
    grid-template-columns: 1fr;
  }

  .login-brand {
    padding: 28px 24px;
  }

  .brand-metrics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .login-brand {
    display: none;
  }

  .login-form {
    padding: 26px 18px 20px;
  }

  .mobile-brand {
    display: flex;
  }

  .title-box {
    flex-direction: column;
  }

  .captcha-row :deep(.el-form-item__content) {
    grid-template-columns: 1fr;
  }
}

html.dark {
  .login {
    background:
      linear-gradient(110deg, rgba(4, 15, 35, 0.94), rgba(8, 32, 66, 0.88)),
      url('@/assets/brand/background.png') center / cover no-repeat;
  }

  .el-login-footer {
    color: rgba(226, 232, 240, 0.68);
  }
}
</style>
