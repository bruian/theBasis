<template>
	<v-card>
		<v-toolbar card flat dense color="transparent" v-if="enableHeader">
			<v-toolbar-title><h4>Groups list</h4></v-toolbar-title>

		</v-toolbar>
		<v-divider class="ma-0" v-if="enableHeader"></v-divider>
		<v-card-text>
			<v-list>
				<v-list-group
					v-model="item.active"
					v-for="item in topics"
					:key="item.title"
					:prepend-icon="item.action"
					no-action
				>
					<v-list-tile slot="activator">
						<v-list-tile-content>
							<v-list-tile-title>{{ item.title }}</v-list-tile-title>
						</v-list-tile-content>
					</v-list-tile>
					<v-list-tile v-for="subItem in item.items" :key="subItem.title" href="#">
						<v-list-tile-content>
							<v-list-tile-title>{{ subItem.title }}</v-list-tile-title>
						</v-list-tile-content>
						<v-list-tile-action>
							<v-icon>{{ subItem.action }}</v-icon>
						</v-list-tile-action>
					</v-list-tile>
				</v-list-group>
			</v-list>
		</v-card-text>
	</v-card>
</template>

<script>
export default {
	data: () => ({
		enableHeader: true,
		topics: [
			{
				action: 'local_activity',
				title: 'Attractions',
				items: [
					{ title: 'List Item' }
				]
			},
			{
				action: 'restaurant',
				title: 'Dining',
				active: true,
				items: [
					{ title: 'Breakfast & brunch' },
					{ title: 'New American' },
					{ title: 'Sushi' }
				]
			}
		]
	}),
  methods: {
    handleClick (e) {
      return false;
    }
  }
}
</script>

<style>

</style>
