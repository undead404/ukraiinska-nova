---
title: 'Українська нова'
layout: default
---

Ласкаво просимо! Ось сторінки релізів за різні дні:

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
      <span> — {{ post.date | date: "%B %d, %Y" }}</span>
      {% if post.summary %}
        <p>{{ post.summary }}</p>
      {% endif %}
    </li>
  {% endfor %}
</ul>
