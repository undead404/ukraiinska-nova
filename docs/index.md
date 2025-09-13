---
css: '/assets/css/main.css'
layout: default
title: 'Українська нова'
---

<main class="main-content">
  <header>
    <h1>{{ site.title }}</h1>
    <p>{{ site.description }}</p>
  </header>
  <section aria-label="Список релізів">
    <ol class="release-list">
      {% for post in site.posts %}
        <li>
          <article>
            <h2>
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </h2>
            <time datetime="{{ post.date | date_to_xmlschema }}">
              {{ post.date | date: "%B %d, %Y" }}
            </time>
            {% if post.summary %}
              <div class="summary">{{ post.summary }}</div>
            {% endif %}
          </article>
        </li>
      {% endfor %}
    </ol>
  </section>
</main>
