<template>
	<div class='tgmUsers-view'>
		<h1>Actived telegram users</h1>
    <TelegramUsers></TelegramUsers>
	</div>
</template>

<script>
const createListView = id => () => import('../views/FactoryListView').then(m => m.default(id))

export default {
  name: 'tgmUsers-view',
  components: { 
    TelegramUsers: createListView('tgmUsers')
  },
	meta() {
		return {
			title: 'Telegram users',
			description: 'This is list of telegram users'
		}
	}
}
</script>
