<template>
  <div class="home">
    <section class="hero-panel">
      <div class="hero-copy">
        <span class="hero-badge">JINGDAO PROPERTY</span>
        <h1>{{ greeting }}，{{ displayName }}</h1>
        <p>欢迎使用景道物业管理平台。{{ projectMessage }}</p>
        <div class="hero-meta">
          <span><el-icon><Calendar /></el-icon>{{ currentDate }}</span>
          <span v-if="currentProjectStore.currentProjectName"><el-icon><Location /></el-icon>当前项目：{{ currentProjectStore.currentProjectName }}</span>
        </div>
      </div>
      <img :src="brandLogo" class="hero-logo" alt="景道" />
    </section>

    <section class="section-card">
      <div class="section-head">
        <div><span class="section-kicker">BUSINESS OVERVIEW</span><h2>业务概览</h2><p>当前未接入首页聚合统计接口，不发起额外业务请求，避免越权与虚构数据。</p></div>
      </div>
      <div class="overview-grid">
        <article v-for="item in overviewItems" :key="item.title" class="overview-card">
          <div class="overview-icon"><el-icon><component :is="item.icon" /></el-icon></div>
          <h3>{{ item.title }}</h3><span>{{ item.description }}</span>
          <el-tag :type="item.available ? 'success' : 'info'" effect="light">{{ item.available ? '已授权' : '暂无入口' }}</el-tag>
        </article>
      </div>
    </section>

    <section class="section-card">
      <div class="section-head">
        <div><span class="section-kicker">QUICK ACCESS</span><h2>常用功能</h2><p>入口来自当前账号的动态菜单，仅展示已授权功能。</p></div>
      </div>
      <div v-if="quickLinks.length" class="shortcut-grid">
        <button v-for="item in quickLinks" :key="item.path" type="button" class="shortcut-card" @click="openMenu(item.path)">
          <span class="shortcut-icon"><svg-icon v-if="item.icon" :icon-class="item.icon" /><el-icon v-else><Grid /></el-icon></span>
          <span class="shortcut-copy"><strong>{{ item.title }}</strong><small>进入功能</small></span>
          <el-icon class="shortcut-arrow"><ArrowRight /></el-icon>
        </button>
      </div>
      <el-empty v-else description="当前账号暂无可用业务菜单" :image-size="88" />
    </section>
  </div>
</template>

<script setup name="Index" lang="ts">
import { ArrowRight, Calendar, Grid, House, Location, Money, OfficeBuilding, User, Van } from '@element-plus/icons-vue';
import brandLogo from '@/assets/brand/logo.png';
import router from '@/router';
import { useCurrentProjectStore } from '@/store/modules/currentProject';
import { usePermissionStore } from '@/store/modules/permission';
import { useUserStore } from '@/store/modules/user';
import {
  BUSINESS_ENTRY_PATHS,
  collectAuthorizedMenuLinks,
  findAuthorizedBusinessEntry,
  type AuthorizedMenuRoute
} from './homeMenu';

const userStore = useUserStore();
const permissionStore = usePermissionStore();
const currentProjectStore = useCurrentProjectStore();
const displayName = computed(() => userStore.nickname || '用户');
const currentDate = new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '上午好';
  if (hour < 18) return '下午好';
  return '晚上好';
});
const projectMessage = computed(() => {
  if (!currentProjectStore.required) return '您可以从已授权菜单开始处理日常工作。';
  if (currentProjectStore.currentProjectName) return `当前工作范围为“${currentProjectStore.currentProjectName}”。`;
  return '请先在顶部选择当前物业项目，再开展项目级业务。';
});

const authorizedLinks = computed(() => collectAuthorizedMenuLinks(permissionStore.defaultRoutes as AuthorizedMenuRoute[]));
const quickLinks = computed(() => authorizedLinks.value.slice(0, 8));
const hasBusinessEntry = (paths: readonly string[]) => Boolean(findAuthorizedBusinessEntry(authorizedLinks.value, [...paths]));
const overviewItems = computed(() => [
  { title: '项目概况', description: '按当前账号授权范围进入项目管理', icon: OfficeBuilding, available: hasBusinessEntry(BUSINESS_ENTRY_PATHS.project) },
  { title: '房屋与入住', description: '房屋、楼栋及入住关系管理入口', icon: House, available: hasBusinessEntry(BUSINESS_ENTRY_PATHS.resource) },
  { title: '业主与住户', description: '客户、业主及住户资料管理入口', icon: User, available: hasBusinessEntry(BUSINESS_ENTRY_PATHS.customer) },
  { title: '收费管理', description: '应收、收款及收费规则管理入口', icon: Money, available: hasBusinessEntry(BUSINESS_ENTRY_PATHS.charge) },
  { title: '仓库库存', description: '物料、库存及出入库管理入口', icon: Van, available: hasBusinessEntry(BUSINESS_ENTRY_PATHS.warehouse) }
]);
const openMenu = (path: string) => router.push(path);
</script>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-panel,
.section-card {
  border-radius: 28px;
  border: 1px solid var(--app-surface-border);
  background: var(--app-surface-bg);
  box-shadow: var(--app-shadow-sm);
  backdrop-filter: blur(18px);
}

.hero-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
  gap: 18px;
  padding: 30px;
  background: radial-gradient(circle at top left, rgba(53, 109, 255, 0.16), transparent 30%), var(--app-surface-bg);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 14px;

  h1 {
    margin: 0;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1.06;
    letter-spacing: -0.04em;
    color: var(--app-text-title);
  }

  p {
    margin: 0;
    max-width: 760px;
    color: var(--app-text-muted);
    font-size: 15px;
    line-height: 1.8;
  }
}

.hero-badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(53, 109, 255, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 8px;
}

.hero-stats {
  display: grid;
  gap: 12px;
}

.stat-card {
  padding: 18px 20px;
  border-radius: 22px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  display: flex;
  flex-direction: column;
  gap: 6px;

  strong {
    color: var(--app-text-title);
    font-size: 24px;
    letter-spacing: -0.03em;
  }

  span {
    color: var(--app-text-muted);
    font-size: 13px;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(300px, 0.85fr);
  gap: 20px;
}

.section-card {
  padding: 24px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;

  h2 {
    margin: 6px 0 0;
    color: var(--app-text-title);
    font-size: 26px;
    letter-spacing: -0.03em;
  }
}

.section-kicker {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-list,
.capability-groups {
  display: grid;
  gap: 16px;
}

.product-card {
  padding: 22px;
  border-radius: 24px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--app-shadow-sm);
    border-color: rgba(53, 109, 255, 0.2);
  }
}

.product-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;

  h3 {
    margin: 0 0 8px;
    color: var(--app-text-title);
    font-size: 22px;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0;
    color: var(--app-text-muted);
    line-height: 1.8;
  }
}

.product-version {
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(53, 109, 255, 0.12);
  color: var(--app-accent-strong);
  font-size: 12px;
  font-weight: 700;
}

.product-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 18px;
}

.product-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.capability-card {
  background: radial-gradient(circle at top right, rgba(14, 165, 233, 0.12), transparent 28%), var(--app-surface-bg);
}

.capability-group {
  padding: 18px 18px 18px 20px;
  border-radius: 22px;
  background: var(--app-elevated-soft-bg);
  border: 1px solid var(--app-surface-border);

  h3 {
    margin: 0 0 12px;
    color: var(--app-text-title);
    font-size: 18px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 10px;
  }

  li {
    position: relative;
    padding-left: 16px;
    color: var(--app-text-muted);
    line-height: 1.7;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 10px;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--app-accent-strong);
      box-shadow: 0 0 0 5px rgba(53, 109, 255, 0.12);
    }
  }
}

@media (max-width: 960px) {
  .hero-panel,
  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-panel,
  .section-card {
    padding: 20px;
    border-radius: 22px;
  }

  .product-top {
    flex-direction: column;
  }
}

html.dark {
  .hero-panel {
    background: radial-gradient(circle at top left, rgba(53, 109, 255, 0.18), transparent 30%), var(--app-surface-bg);
  }
}

.hero-panel {
  position: relative;
  min-height: 230px;
  display: flex;
  align-items: center;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(246, 251, 255, 0.98) 0%, rgba(242, 250, 255, 0.86) 48%, rgba(242, 250, 255, 0.22) 100%),
    url('@/assets/brand/background.png') center / cover no-repeat;
}

.hero-copy { position: relative; z-index: 1; max-width: 760px; }
.hero-copy h1 { margin: 18px 0 10px; color: #17345c; }
.hero-copy p { color: #526b8c; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 12px 20px; margin-top: 22px; color: #3e5f87; font-size: 13px; }
.hero-meta span { display: inline-flex; align-items: center; gap: 7px; }
.hero-logo { position: absolute; right: 5%; width: min(280px, 28vw); max-height: 170px; object-fit: contain; opacity: 0.22; }
.section-head p { margin: 6px 0 0; color: var(--app-text-muted); font-size: 13px; line-height: 1.6; }
.overview-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px; }
.overview-card { min-width: 0; padding: 18px; border-radius: 18px; background: var(--app-elevated-soft-bg); border: 1px solid var(--app-surface-border); }
.overview-icon { width: 40px; height: 40px; display: grid; place-items: center; margin-bottom: 16px; border-radius: 13px; color: #1677ff; background: rgba(22, 119, 255, 0.1); font-size: 20px; }
.overview-card h3 { margin: 0 0 7px; color: var(--app-text-title); font-size: 16px; }
.overview-card > span { display: block; min-height: 40px; color: var(--app-text-muted); font-size: 12px; line-height: 1.6; }
.overview-card .el-tag { margin-top: 14px; }
.shortcut-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.shortcut-card { display: flex; align-items: center; gap: 13px; padding: 16px; color: inherit; text-align: left; border: 1px solid var(--app-surface-border); border-radius: 18px; background: var(--app-elevated-soft-bg); cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease; }
.shortcut-card:hover { transform: translateY(-2px); border-color: rgba(22, 119, 255, 0.28); box-shadow: var(--app-shadow-sm); }
.shortcut-icon { width: 40px; height: 40px; flex: 0 0 40px; display: grid; place-items: center; border-radius: 13px; color: #fff; background: linear-gradient(135deg, #1677ff, #20c9d2); font-size: 18px; }
.shortcut-copy { min-width: 0; display: flex; flex: 1; flex-direction: column; gap: 5px; }
.shortcut-copy strong { overflow: hidden; color: var(--app-text-title); font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.shortcut-copy small, .shortcut-arrow { color: var(--app-text-muted); }

@media (max-width: 1200px) { .overview-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 900px) { .shortcut-grid { grid-template-columns: repeat(2, 1fr); } .hero-logo { opacity: 0.12; } }
@media (max-width: 640px) {
  .hero-panel { min-height: 250px; background-position: 62% center; }
  .hero-logo { display: none; }
  .overview-grid, .shortcut-grid { grid-template-columns: 1fr; }
  .overview-card > span { min-height: 0; }
}

html.dark .hero-panel {
  background:
    linear-gradient(90deg, rgba(8, 24, 50, 0.98), rgba(10, 40, 78, 0.84)),
    url('@/assets/brand/background.png') center / cover no-repeat;
}
html.dark .hero-copy h1 { color: #f8fbff; }
html.dark .hero-copy p, html.dark .hero-meta { color: #c3d4ea; }
</style>
