<template>
  <v-card class="elevation-0" light>
    <v-toolbar card dense color="transparent">
      <v-toolbar-title><h4 class="ma-0">Notification</h4></v-toolbar-title>
    </v-toolbar>
    <v-divider class="ma-0"></v-divider>
    <v-card-text class="pa-0">
      <v-list two-line class="pa-0">
        <template v-for="(item, index) in items">
          <v-subheader v-if="item.header" :key="item.header">{{ item.header }}</v-subheader>
          <v-divider v-else-if="item.divider" :key="index" class="ma-0"></v-divider>
          <v-list-tile avatar v-else :key="item.title" @click="handleClick">
            <v-list-tile-avatar :color="item.color">
              <v-icon dark>{{item.icon}}</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-sub-title v-html="item.title"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action class="caption">
              {{item.timeLabel}}
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
      <v-divider class="ma-0"></v-divider>
      <v-btn block flat class="ma-0">All</v-btn>
    </v-card-text>
  </v-card>
</template>

<script>
export default {
  data: () => ({
    items: [
			{
				title: 'New user registered',
				color: 'light-green',
				icon: 'account_circle',
				timeLabel: 'Just now'
			},
			{ divider: true, inset: true },
			{
				title: 'New order received',
				color: 'light-blue',
				icon: 'shopping_cart',
				timeLabel: '2 min ago'
			},
			{ divider: true, inset: true },
			{
				title: 'New payment made',
				color: 'cyan',
				icon: 'payment',
				timeLabel: '24 min ago'
			},
			{ divider: true, inset: true },
			{
				title: 'New message from Michael',
				color: 'red',
				icon: 'email',
				timeLabel: '1 hour ago'
			}
		]
  }),
  methods: {
    handleClick: (e) => {
      console.log(e)
    }
  },
}
</script>

<style lang="stylus">
</style>
