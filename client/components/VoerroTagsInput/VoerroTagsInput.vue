<template>
	<div>
		<div :class="inputClass + ' tags-input'">
			<span class="badge badge-pill badge-light"
				v-for="(badge, index) in tagBadges"
				:key="index">
				<span v-html="badge"></span>

				<i href="#" class="tags-input-remove" @click.prevent="removeTag(index)"></i>
			</span>

			<input type="text"
				ref="taginput"
				:placeholder="placeholder"
				v-model="input"
				@keydown.enter.prevent="tagFromInput"
				@keydown.8="removeLastTag"
				@keydown.down="nextSearchResult"
				@keydown.up="prevSearchResult"
				@keydown="onKeyDown"
				@keyup.esc="ignoreSearchResults"
				@keyup="searchTag"
				@focus="onFocus"
				@blur="hideTypeahead"
				@value="tags"></input>

			<input type="hidden" v-if="elementId"
				:name="elementId"
				:id="elementId"
				v-model="hiddenInput"></input>
		</div>

		<p v-show="searchResults.length" class="typeahead">
			<span v-for="(tag, index) in searchResults"
				:key="index"
				v-text="tag.text"
				@mousedown.prevent="tagFromSearchOnClick(tag)"
				class="badge"
				v-bind:class="{
					'badge-primary': index == searchSelection,
					'badge-dark': index != searchSelection
				}">
			</span>
		</p>
	</div>
</template>

<script>
export default {
	props: {
		elementId: String,
		inputClass: {
			type: String,
			default: 'tags-input-default-class'
		},
		existingTags: {
			type: Object,
			default: () => { return {} }
		},
		tagInput: {
			type: Array,
			default: () => { return [] }
		},
		value: {
			type: [Array, String],
			default: () => { return [] }
		},
		typeahead: {
			type: Boolean,
			default: false
		},
		typeaheadActivationThreshold: {
			type: Number,
			default: 1
		},
		typeaheadMaxResults: {
			type: Number,
			default: 0
		},
		placeholder: {
			type: String,
			default: 'Add a tag'
		},
		limit: {
			type: Number,
			default: 0
		},
		onlyExistingTags: {
			type: Boolean,
			default: false
		},
		deleteOnBackspace: {
			type: Boolean,
			default: true
		},
		allowDuplicates: {
			type: Boolean,
			default: false
		},
		validate: {
			type: Function,
			default: () => true
		},
		addTagsOnComma: {
			type: Boolean,
			default: false
		},
	},
	data () {
		return {
			badgeId: 0,
			tagBadges: [],
			tags: [],

			input: '',
			oldInput: '',
			hiddenInput: '',

			searchResults: [],
			searchSelection: 0,
		}
	},
	created () {
		this.tagsFromValue()
		this.tagsFromTagInput()

		// Emit an event
		this.$emit('initialized')
	},
	watch: {
		tags() {
			// Updating the hidden input
			this.hiddenInput = this.tags.join(',')

			// Update the bound v-model value
			this.$emit('input', this.tags)
		},
		value() {
			this.tagsFromValue()
		},
		tagInput() {
			this.tagsFromTagInput()
		}
	},
	methods: {
		escapeRegExp(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
		},
		tagFromInput() {
			// If we're choosing a tag from the search results
			if (this.searchResults.length && this.searchSelection >= 0) {
				this.tagFromSearch(this.searchResults[this.searchSelection])

				this.input = ''
			} else {
				// If we're adding an unexisting tag
				let text = this.input.trim()

				// If the new tag is not an empty string and passes validation
				if (!this.onlyExistingTags && text.length && this.validate(text)) {
					this.input = ''

					// Determine the tag's slug and text depending on if the tag exists
					// on the site already or not
					let slug = this.makeSlug(text)
					let existingTag = this.existingTags[slug]

					slug = existingTag ? slug : text
					text = existingTag ? existingTag : text

					this.addTag(slug, text)
				}
			}
		},
		tagFromSearchOnClick(tag) {
			this.tagFromSearch(tag)

			this.$refs['taginput'].blur()
		},
		tagFromSearch(tag) {
			this.searchResults = []
			this.input = ''
			this.oldInput = ''

			this.addTag(tag.slug, tag.text)
		},
		makeSlug(value) {
			return value.toLowerCase().replace(/\s/g, '-')
		},
		addTag(slug, text) {
			// Check if the limit has been reached
			if (this.limit > 0 && this.tags.length >= this.limit) {
				return false
			}

			// Attach the tag if it hasn't been attached yet
			if (!this.tagSelected(text)) {
				this.tagBadges.push(text.replace(/\s/g, '&nbsp;'))
				this.tags.push(slug)
			}

			// Emit events
			this.$emit('tag-added', slug)
			this.$emit('tags-updated')
		},
		removeLastTag() {
			if (!this.input.length && this.deleteOnBackspace) {
				this.removeTag(this.tags.length - 1)
			}
		},
		removeTag(index) {
			let slug = this.tags[index]

			this.tags.splice(index, 1)
			this.tagBadges.splice(index, 1)

			// Emit events
			this.$emit('tag-removed', slug)
			this.$emit('tags-updated')
		},
		searchTag() {
			if (this.typeahead === true) {
				if (this.oldInput != this.input || (!this.searchResults.length && this.typeaheadActivationThreshold == 0)) {
					this.searchResults = []
					this.searchSelection = 0
					let input = this.input.trim()

					if ((input.length && input.length >= this.typeaheadActivationThreshold) || this.typeaheadActivationThreshold == 0) {
						for (let slug in this.existingTags) {
							let text = this.existingTags[slug].toLowerCase()

							if (text.search(this.escapeRegExp(input.toLowerCase())) > -1 && ! this.tagSelected(slug)) {
								this.searchResults.push({ slug, text: this.existingTags[slug] })
							}
						}

						// Sort the search results alphabetically
						this.searchResults.sort((a, b) => {
							if (a.text < b.text) return -1
							if (a.text > b.text) return 1

							return 0
						})

						// Shorten Search results to desired length
						if (this.typeaheadMaxResults > 0) {
							this.searchResults = this.searchResults.slice(
								0,
								this.typeaheadMaxResults
							)
						}
					}

					this.oldInput = this.input
				}
			}
		},
		onFocus() {
			this.searchTag()
		},
		hideTypeahead() {
			if (! this.input.length) {
				this.$nextTick(() => {
					this.ignoreSearchResults()
				})
			}
		},
		nextSearchResult() {
			if (this.searchSelection + 1 <= this.searchResults.length - 1) {
				this.searchSelection++
			}
		},
		prevSearchResult() {
			if (this.searchSelection > 0) {
				this.searchSelection--
			}
		},
		ignoreSearchResults() {
			this.searchResults = []
			this.searchSelection = 0
		},
		/**
		* Clear the list of selected tags
		*/
		clearTags() {
			this.tags.splice(0, this.tags.length)
			this.tagBadges.splice(0, this.tagBadges.length)
		},
		/**
		* Replace the currently selected tags with the tags from the value
		*/
		tagsFromValue() {
			if (this.value && this.value.length) {
				let tags = Array.isArray(this.value)
					? this.value
					: this.value.split(',')

				if (this.tags == tags) {
					return
				}

				this.clearTags()

				for (let slug of tags) {
					let existingTag = this.existingTags[slug]
					let text = existingTag ? existingTag : slug

					this.addTag(slug, text)
				}
			} else {
				if (this.tags.length == 0) {
					return
				}

				this.clearTags()
			}
		},
		tagsFromTagInput() {
			if (this.tagInput && this.tagInput.length) {
				let tags = Array.isArray(this.tagInput) ? this.tagInput : this.tagInput.split(',')

				if (this.tags == tags) {
					return
				}

				this.clearTags()

				for (let slug of tags) {
					let existingTag = this.existingTags[slug]
					let text = existingTag ? existingTag : slug

					this.addTag(slug, text)
				}
			}
		},
		/**
		* Check if the tag with the provided slug is already selected
		*/
		tagSelected (slug) {
			if (this.allowDuplicates) {
				return false
			}

			if (! slug) {
				return false
			}

			let searchSlug = this.makeSlug(slug)
			let found = this.tags.find((value) => {
				return searchSlug == this.makeSlug(value)
			})

			return !! found
		},
		/**
		 * Process all the keydown events
		 */
		onKeyDown(e) {
			// Insert a new tag on comma keydown if the option is enabled
			if (e.key == ',') {
				if (this.addTagsOnComma) {
					// The comma shouldn't actually be inserted
					e.preventDefault()

					// Add the inputed tag
					this.tagFromInput()
				}
			}
		},
	}
}
</script>

<style>
/* tags-input */
.tags-input {
	display: flex;
	flex-wrap: wrap;
	align-items: center;
}

.tags-input input {
	flex: 1;
	background: transparent;
	border: none;
}

.tags-input span {
	margin-right: 0.3rem;
	/* margin-bottom: 0.2rem; */
}

.typeahead > span {
	cursor: pointer;
	margin-right: 0.3rem;
}

.typeahead {
	margin-bottom: 1px;
}

.badge {
	display: inline-block;
	padding: 0.25em 0.25em;
	font-size: 75%;
	font-weight: 700;
	line-height: 1;
	text-align: center;
	white-space: nowrap;
	vertical-align: baseline;
	border-radius: 0.25rem;
}

.badge:empty {
	display: none;
}

.badge-pill {
	padding-right: 0.6em;
	padding-left: 0.6em;
	border-radius: 10rem;
}

.badge-primary {
	color: #fff;
	background-color: #007bff;
}

.badge-primary[href]:focus, .badge-primary[href]:hover {
	color: #fff;
	text-decoration: none;
	background-color: #0062cc;
}

.badge-light {
	color: #212529;
	background-color: #e9ecef;
	/* background-color: #f8f9fa; */
}

.badge-light[href]:focus, .badge-light[href]:hover {
	color: #212529;
	text-decoration: none;
	background-color: #dae0e5;
}

.badge-dark {
	color: #fff;
	background-color: #343a40;
}

.badge-dark[href]:focus, .badge-dark[href]:hover {
	color: #fff;
	text-decoration: none;
	background-color: #1d2124;
}

.tags-input-default-class {
	/* padding: .5rem .25rem; -initial*/
	/* background: #fff; */
	/* border: 1px solid transparent; */
	/* border-radius: .25rem; */
	/* border-color: #dbdbdb; */
	padding: 1px;
	min-height: 23px;
}

.tags-input-remove {
	cursor: pointer;
	position: relative;
	display: inline-block;
	width: 0.5rem;
	height: 0.5rem;
	overflow: hidden;
}

.tags-input-remove:before, .tags-input-remove:after {
	content: '';
	position: absolute;
	width: 100%;
	top: 50%;
	left: 0;
	background: #5dc282;

	height: 2px;
	margin-top: -1px;
}

.tags-input-remove:before {
	transform: rotate(45deg);
}
.tags-input-remove:after {
	transform: rotate(-45deg);
}

.tags-input input:focus {
	outline: none;
}

.tags-input input[type="text"] {
	color: #495057;
	font-size: 12px;
}
</style>
