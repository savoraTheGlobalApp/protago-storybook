# Your Story Landing Page - Image Requirements Guide

This guide details all the image placeholders and requirements for the "Your Story" landing page, designed to showcase Indian mythology and ancient values.

## Overview

The page is **completely standalone** with no navigation links to the main icurious.ai site. This allows you to run A/B tests and marketing experiments independently.

**Live URL**: `http://localhost:3000/your-story` (or `https://icurious.ai/your-story` when deployed)

---

## Image Locations & Requirements

### 1. Hero Section Background Pattern
**Location**: Line ~118 in `YourStory.tsx`
**Purpose**: Subtle background texture to evoke ancient manuscripts
**Requirements**:
- Ancient Indian manuscript/palm leaf texture
- OR subtle mandala pattern overlay
- **Size**: 1920x1080px (full width)
- **Opacity**: 5-10% (very subtle)
- **Style**: Sepia tones, aged paper look

**Suggested Images**:
- Scanned ancient Sanskrit manuscripts
- Traditional mandala patterns
- Vedic yantra designs
- Temple wall texture

---

### 2. Decorative Corner Elements (Hero Section)
**Location**: Lines ~92-98 in `YourStory.tsx`
**Purpose**: Add traditional Indian aesthetic to hero section
**Requirements**:
- Traditional Indian borders or rangoli patterns
- Om symbols (ॐ)
- Lotus flowers
- **Size**: 150-200px each
- **Opacity**: 20%
- **Style**: Line art or simple illustrations

**Suggested Images**:
- Vector Om symbols
- Traditional corner border designs (like those on wedding cards)
- Lotus illustrations in traditional Indian art style
- Peacock feather designs

---

### 3. Sanskaar Section Icon
**Location**: Line ~211 in `YourStory.tsx`
**Purpose**: Visual symbol for "loss of values"
**Requirements**:
- **Size**: 60-80px
- **Style**: Simple, iconic
- **Options**:
  - Broken chain (representing broken tradition)
  - Wilting lotus (fading values)
  - Cracked temple pillar
  - Traditional border design

---

### 4. Epic Lessons Character Images (CRITICAL)
**Location**: Lines ~327-337 in `YourStory.tsx`
**Purpose**: Bring the epics to life with character illustrations

#### Image 1: Mahabharata - धर्म (Dharma)
- **Scene**: Krishna and Arjuna on chariot (Bhagavad Gita scene)
- **Alternative**: Arjuna with bow, conflicted expression
- **Size**: 250x250px
- **Style**: Traditional Indian art (Madhubani, Pattachitra) or respectful modern illustration
- **Key Elements**: Chariot, horses, Krishna with peacock feather, Arjuna with bow

#### Image 2: Ramayana - मर्यादा (Maryada)
- **Scene**: Ram with bow (धनुष)
- **Alternative**: Ram, Sita, and Hanuman together
- **Alternative**: Ram breaking Shiva's bow (Sita Swayamvar)
- **Size**: 250x250px
- **Style**: Traditional Indian art style
- **Key Elements**: Ram's iconic crown, bow, golden/yellow clothing

#### Image 3: Vedas - सत्य (Satya)
- **Scene**: Ancient sage/rishi meditating under tree
- **Alternative**: Vedic fire ceremony (यज्ञ)
- **Alternative**: Om symbol with elaborate mandala
- **Size**: 250x250px
- **Style**: Serene, spiritual aesthetic
- **Key Elements**: Saffron robes, sacred fire, meditation posture, Om symbol

---

### 5. Satsang Section Images
**Location**: Lines ~420-430 and ~445-455 in `YourStory.tsx`
**Purpose**: Show parent-child bonding through stories

#### Image 1: कथा का समय (Story Time)
- **Scene**: Parent and child sitting together, engaged in storytelling
- **Alternative**: Grandmother telling stories to children in traditional Indian home
- **Alternative**: Family gathered around during evening story session
- **Size**: 400x250px
- **Style**: Warm, intimate, Indian household setting
- **Key Elements**:
  - Traditional Indian clothing
  - Warm lighting (diya/lamp in background)
  - Books or mobile device showing story app
  - Expressions of engagement and joy

#### Image 2: संस्कार की नींव (Seeds of Sanskaar)
- **Scene**: Child holding mobile device, looking engaged and happy
- **Alternative**: Child with traditional Indian value symbols (diya, books, lotus)
- **Alternative**: Child in thoughtful pose with cultural artifacts
- **Size**: 400x250px
- **Style**: Modern but culturally rooted
- **Key Elements**:
  - Child (age 5-10)
  - Symbols of learning and values
  - Bright, hopeful atmosphere

---

## Design Style Guidelines

### Color Palette
- **Primary**: Saffron (#FF9933), Deep Orange (#C25100)
- **Secondary**: Red (#DC2626), Amber (#F59E0B)
- **Accents**: Gold (#FFD700), Warm Yellows
- **Avoid**: Cool blues, greens, purples (not aligned with theme)

### Art Style Preferences
1. **Traditional Indian Art Styles** (Preferred):
   - Madhubani painting style
   - Pattachitra art
   - Warli art (for folk stories)
   - Traditional miniature painting style

2. **Modern Illustrations** (Alternative):
   - Flat design with Indian motifs
   - Semi-realistic with traditional clothing/settings
   - Vector art with cultural accuracy

3. **Photography** (If used):
   - Natural lighting
   - Traditional Indian household settings
   - Authentic clothing (not costumes)
   - Diverse Indian families

### What to Avoid
- ❌ Overly Western/modern aesthetics
- ❌ Cartoonish or disrespectful depictions of deities
- ❌ Cultural inaccuracies (wrong clothing, symbols, etc.)
- ❌ Stock photos that look staged or inauthentic
- ❌ AI-generated faces that look uncanny

---

## Where to Source Images

### Option 1: Commission Custom Illustrations (BEST)
- **Hire Indian artists** familiar with mythology and traditional art
- Platforms: Fiverr, Upwork, Behance
- Budget: $50-200 per illustration
- **Advantage**: Culturally authentic, unique, rights-owned

### Option 2: Royalty-Free Indian Art
- **Unsplash**: Search "Indian art", "Indian family", "traditional India"
- **Pexels**: Filter by Indian culture
- **Freepik**: Indian mythology illustrations (check license)
- **Indian Government Archives**: Public domain historical art
- **Advantage**: Free or low-cost, immediate use

### Option 3: AI-Generated Images (with caution)
- **Tools**: Midjourney, DALL-E 3, Stable Diffusion
- **Prompts**:
  - "Krishna and Arjuna on chariot, Bhagavad Gita scene, traditional Madhubani art style, warm colors"
  - "Indian grandmother telling stories to children, traditional Indian home, warm lighting, photorealistic"
  - "Ancient Indian sage meditating, Vedic era, traditional painting style, saffron and gold colors"
- **Advantage**: Quick iterations, custom to needs
- **Disadvantage**: May need human touch-up for cultural accuracy

### Option 4: Purchase from Indian Art Marketplaces
- **Artflute**: Traditional Indian art
- **Indian Art Collectors**: Authentic reproductions
- **Check licensing**: Ensure commercial use rights

---

## Implementation Checklist

### Phase 1: Critical Images (Launch Blockers)
- [ ] Epic Lessons - Mahabharata character/scene
- [ ] Epic Lessons - Ramayana character/scene
- [ ] Epic Lessons - Vedas/sage illustration
- [ ] Satsang - Parent-child storytelling photo

### Phase 2: Enhancement Images
- [ ] Hero section background pattern
- [ ] Decorative corner elements (2x)
- [ ] Sanskaar section icon
- [ ] Satsang - Child learning values scene

### Phase 3: Polish
- [ ] Add subtle animations to images
- [ ] Optimize image file sizes (WebP format)
- [ ] Add alt text for accessibility
- [ ] Test on mobile devices

---

## File Paths for Images

Once you have images, place them in:
```
iCuriousAI_website/
├── public/
│   └── your-story/
│       ├── hero-bg-pattern.png
│       ├── corner-lotus-1.png
│       ├── corner-lotus-2.png
│       ├── mahabharata-scene.png
│       ├── ramayana-scene.png
│       ├── vedas-sage.png
│       ├── storytelling-family.jpg
│       └── child-learning.jpg
```

Then import in `YourStory.tsx`:
```tsx
// At top of file
import mahabharataScene from '/your-story/mahabharata-scene.png';
import ramayanaScene from '/your-story/ramayana-scene.png';
// etc...

// Use in component
<img src={mahabharataScene} alt="Krishna and Arjuna" className="..." />
```

---

## Cultural Sensitivity Notes

When sourcing or creating images:
- **Respect religious sentiment**: Don't use images that could be seen as disrespectful to Hindu deities
- **Consult Indian advisors**: Get feedback from Indian community members
- **Avoid stereotypes**: Don't use clichéd or Orientalist depictions
- **Accuracy matters**: Incorrect symbolism or clothing can undermine credibility

---

## Next Steps

1. **Prioritize the Epic Lessons images** - these are the most impactful
2. **Test with target audience** - Show Indian parents mockups before finalizing
3. **Optimize for performance** - Use WebP, lazy loading, proper sizing
4. **Add loading states** - Skeleton screens while images load
5. **Monitor page speed** - Ensure images don't slow down the page

---

## Contact for Questions

For questions about image requirements or cultural authenticity:
- Email: hello@icurious.ai
- Reference this guide when communicating with designers/artists

---

**Last Updated**: 2025-02-06
**Page Version**: Standalone (no links to main site)
