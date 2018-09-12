<template>
	<v-dialog v-model="value" width="500px">
		<v-card class="elevation-12">
			<v-card-title primary-title>
				<div>
					<div class="headline">Поздравляем!</div>
					<p>Ваш аккаунт успешно активирован</p>
				</div>
			</v-card-title>
			<v-card-actions>
				<v-spacer></v-spacer>
				<v-btn color="primary"
					@click="$emit('input', false)"
					slot="activator"
					type="button">
					OK
				</v-btn>
				<v-spacer></v-spacer>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script>
export default {
	name: 'MessageDialog',
	props: {
		value: {
			type: Boolean,
			required: true
		}
	}
}
</script>

<style lang="stylus">

</style>
