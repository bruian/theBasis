<template>
	<div class='home-view'>
		<h1>Actived telegram users</h1>
    <TelegramUsers></TelegramUsers>
	</div>
</template>

<script>
const createListView = id => () => import('../views/FactoryListView').then(m => m.default(id))

export default {
  name: 'Home',
  components: { 
    TelegramUsers: createListView('top')
  },
	meta() {
		return {
			title: 'Home',
			description: 'This is the meta description for the home page'
		}
	}
}
</script>
