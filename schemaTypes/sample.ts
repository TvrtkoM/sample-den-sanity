import { defineType, defineField } from 'sanity'

export const sample = defineType({
  name: 'sample',
  title: 'Sample',
  type: 'document',
  fields: [

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required().min(2),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),

    defineField({
      name: 'priceUsd',
      title: 'Price (USD)',
      type: 'number',
      validation: (Rule) => Rule.required()
    }),

    // --- Categories (many-to-many) ---
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
      validation: (Rule) => 
        Rule.required()
          .min(1)
          .error('Add at least one category'),
    }),

    // --- High-resolution file (WAV on S3) ---
    defineField({
      name: 'highResFile',
      type: 'highResFile'
    }),

    // --- MP3 Preview (Sanity asset reference) ---
    defineField({
      name: 'previewFile',
      title: 'Preview MP3',
      type: 'file',
      options: {
        accept: 'audio/mpeg',
      },
      readOnly: true,
      description:
        'Automatically generated low-resolution MP3 preview for playback in the site or Studio.',
    }),
  ],

  // --- Studio preview configuration ---
  preview: {
    select: {
      title: 'title',
      categories: 'categories',
    },
    prepare({ title, categories }) {
      const count = Array.isArray(categories) ? categories.length : 0
      return {
        title,
        subtitle: count > 0 ? `${count} categor${count > 1 ? 'ies' : 'y'}` : 'No categories',
      }
    },
  },
})
