<template>
	<v-navigation-drawer
		id="appDrawer"
		:mini-variant.sync="mini"
		fixed
		:clipped="$vuetify.breakpoint.lgAndUp"
		v-model="localDrawer"
		width="260"
		stateless
		app
	>
		<!--disable-resize-watcher -->
		<!--v-bind:value="value"-->
		<!--stateless=false панель будет парить сверху-->

		<!--v-toolbar color="primary darken-1" dark>
			<v-toolbar-title class="ml-0 pl-3">
				<span class="hidden-sm-and-down">the Basis</span>
			</v-toolbar-title>
		</v-toolbar-->

		<v-img :aspect-ratio="16/9" src="https://cdn.vuetifyjs.com/images/parallax/material.jpg">
			<v-layout pa-2 column fill-height class="lightbox white--text">
				<v-spacer></v-spacer>
				<v-flex shrink>
					<div class="subheading">{{computeUserInfo.username}}</div>
					<div class="body-1">{{computeUserInfo.email}}</div>
				</v-flex>
			</v-layout>
		</v-img>

		<vue-perfect-scrollbar class="drawer-menu--scroll" :settings="scrollSettings">
			<v-list dense expand>
				<template v-for="(item, i) in menus">
					<!--group with subitems-->
					<v-list-group v-if="item.items" :key="item.name" :group="item.group" :prepend-icon="item.icon" no-action="no-action">
						<v-list-tile slot="activator" ripple="ripple">
							<v-list-tile-content>
								<v-list-tile-title>{{ item.title }}</v-list-tile-title>
							</v-list-tile-content>
						</v-list-tile>
						<template v-for="(subItem, i) in item.items">
							<!--sub group-->
							<v-list-group v-if="subItem.items" :key="subItem.name" :group="subItem.group" sub-group="sub-group">
								<v-list-tile slot="activator" ripple="ripple">
									<v-list-tile-content>
										<v-list-tile-title>{{ subItem.title }}</v-list-tile-title>
									</v-list-tile-content>
								</v-list-tile>
								<!--v-list-tile v-for="(grand, i) in subItem.children" :key="i" :to="genChildTarget(item, grand)" :href="grand.href" ripple="ripple"-->
								<v-list-tile v-for="(grand, i) in subItem.children" :key="i" :to="genChildTarget(item, grand)" ripple="ripple">
									<v-list-tile-content>
										<v-list-tile-title>{{ grand.title }}</v-list-tile-title>
									</v-list-tile-content>
								</v-list-tile>
							</v-list-group>
							<!--child item-->
							<!--v-list-tile v-else :key="i" :to="genChildTarget(item, subItem)" :href="subItem.href" :disabled="subItem.disabled" :target="subItem.target" ripple="ripple"-->
							<v-list-tile v-else :key="i" :to="genChildTarget(item, subItem)" :disabled="subItem.disabled" :target="subItem.target" ripple="ripple">
								<v-list-tile-content>
									<v-list-tile-title><span>{{ subItem.title }}</span></v-list-tile-title>
								</v-list-tile-content>
								<!-- <v-circle class="white--text pa-0 circle-pill" v-if="subItem.badge" color="red" disabled="disabled">{{ subItem.badge }}</v-circle> -->
								<v-list-tile-action v-if="subItem.action">
									<v-icon :class="[subItem.actionClass || 'success--text']">{{ subItem.action }}</v-icon>
								</v-list-tile-action>
							</v-list-tile>
						</template>
					</v-list-group>
					<v-subheader v-else-if="item.header" :key="i">{{ item.header }}</v-subheader>
					<v-divider v-else-if="item.divider" :key="i"></v-divider>

					<!--top-level link-->
					<!--v-list-tile v-else :to="!item.href ? { name: item.name } : null" :href="item.href" ripple="ripple" :disabled="item.disabled" :target="item.target" rel="noopener" :key="item.name"-->
					<v-list-tile v-else :to="!item.href ? { name: item.name } : null" ripple="ripple" :disabled="item.disabled" :target="item.target" rel="noopener" :key="item.name">
						<v-list-tile-action v-if="item.icon">
							<v-icon>{{ item.icon }}</v-icon>
						</v-list-tile-action>

						<v-list-tile-content>
							<v-list-tile-title>{{ item.title }}</v-list-tile-title>
						</v-list-tile-content>

						<!-- <v-circle class="white--text pa-0 chip--x-small" v-if="item.badge" :color="item.color || 'primary'" disabled="disabled">{{ item.badge }}</v-circle> -->
						<v-list-tile-action v-if="item.subAction">
							<v-icon class="success--text">{{ item.subAction }}</v-icon>
						</v-list-tile-action>
						<!-- <v-circle class="caption blue lighten-2 white--text mx-0" v-else-if="item.chip" label="label" small="small">{{ item.chip }}</v-circle> -->
					</v-list-tile>
				</template>
			</v-list>
		</vue-perfect-scrollbar>
	</v-navigation-drawer>
</template>

<script>
import VuePerfectScrollbar from './Perfect-scrollbar.vue'

export default {
	name: 'app-drawer',
	components: {
		VuePerfectScrollbar
	},
	props: {
		value: {
			type: Boolean,
			default: true
		}
	},
	data: () => ({
		scrollSettings: {
			maxScrollLength: 160
		},
		localDrawer: this.value,
		mini: false,
		menus: [
			{
				title: 'Home',
				group: 'apps',
				icon: 'home',
				name: 'home',
			},
			{ header: 'Common' },
			{
				title: 'User',
				group: 'Common',
				icon: 'people',
				//target: '_blank', переход с открытием нового окна
				name: 'user',
			},
			{
				title: 'Main',
				group: 'Common',
				icon: 'list',
				name: 'main-sheets',
			},
			{
				title: 'Widgets',
				group: 'widgets',
				//component: 'widgets',
				icon: 'widgets',
				items: [
					//{ name: 'social', title: 'Social', component: 'components/social' },
					//{ name: 'statistic', title: 'Statistic', badge: 'new' },
				]
			},
			{ header: 'UI Elements' },
			{
				title: 'General',
				group: 'components',
				//component: 'components',
				icon: 'tune',
				items: [
				//	{ name: 'alerts', title: 'Alerts' },
				]
			},
			{ divider: true },
			{ header: 'Extras' },
			{
				title: 'Pages',
				group: 'extra',
				icon: 'list',
				items: [
					{ name: 'iView', title: 'iView', component: 'appGrid' },
					{ name: 'info', title: 'info', component: 'info' }
				]
			},
		],
	}),
	watch: {
		value: function() {
			this.localDrawer = this.value
		},
		localDrawer: function() {
			this.$emit('input', this.localDrawer)
		}
	},
	computed: {
	  computeGroupActive() {
      return true
		},
		computeUserInfo() {
			//debugger
			if (this.$store.state.mainUser) {
				return this.$store.state.mainUser
			} else {
				return { username: '', email: '' }
			}
		}
	},
	methods: {
		genChildTarget (item, subItem) {
      if (subItem.href) return
      if (subItem.component) {
        return {
          name: subItem.component,
        }
      }
      return { name: `${item.group}/${(subItem.name)}` }
    },
	}
}
</script>

<style lang="stylus">
	#appDrawer
		overflow: hidden
		.drawer-menu--scroll
			height: calc(100vh - 48px)
			overflow: auto
</style>
