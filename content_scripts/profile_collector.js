(() => {
  function parseMetaDescription() {
    const meta = document.querySelector('meta[property="og:description"]');
    return meta ? meta.content : null;
  }

  function parseCountsFromMeta(desc) {
    if (!desc) return {};
    const out = {};
    const followerMatch = desc.match(/([0-9,\.]+)\s*Followers/i);
    if (followerMatch) out.followers = Number(followerMatch[1].replace(/[,\.]/g, ''));
    const followingMatch = desc.match(/([0-9,\.]+)\s*Following/i);
    if (followingMatch) out.following = Number(followingMatch[1].replace(/[,\.]/g, ''));
    const postsMatch = desc.match(/([0-9,\.]+)\s*Posts/i);
    if (postsMatch) out.posts = Number(postsMatch[1].replace(/[,\.]/g, ''));
    const handleMatch = desc.match(/\((@[^)]+)\)/);
    if (handleMatch) out.handle = handleMatch[1].replace(/^@/, '');
    return out;
  }

  function extractFromDOM() {
    const result = { followers: null, following: null, posts: null, handle: null, bio: '' };

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle && ogTitle.content) {
      const title = ogTitle.content;
      const m = title.match(/\((@[^)]+)\)/);
      if (m) result.handle = m[1].replace(/^@/, '');
      else if (title.indexOf('(') === -1) result.handle = title.split(' ')[0];
    }

    // bio - try common selectors
    const bioEl = document.querySelector('header section .-vDIg span') || document.querySelector('header section span') || document.querySelector('article header div div span');
    if (bioEl) result.bio = bioEl.innerText.trim();

    // counts - many layouts put counts in header ul li
    const countEls = Array.from(document.querySelectorAll('header ul li'));
    if (countEls.length >= 1) {
      countEls.forEach((li) => {
        const text = (li.innerText || li.textContent || '').trim();
        const numMatch = text.match(/([0-9,\.]+)/);
        const labelMatch = text.match(/Posts|Followers|Following/i);
        const num = numMatch ? Number(numMatch[1].replace(/[,\.]/g, '')) : null;
        if (labelMatch) {
          const label = labelMatch[0].toLowerCase();
          if (label.includes('post')) result.posts = num;
          if (label.includes('follower')) result.followers = num;
          if (label.includes('following')) result.following = num;
        }
      });
    }

    return result;
  }

  function normalizeNumber(n) {
    if (n == null) return null;
    if (typeof n === 'number') return n;
    const str = String(n).replace(/[,\.]/g, '');
    const val = parseInt(str, 10);
    return isNaN(val) ? null : val;
  }

  function collectProfile() {
    const metaDesc = parseMetaDescription();
    const fromMeta = parseCountsFromMeta(metaDesc);
    const fromDom = extractFromDOM();

    const followers = normalizeNumber(fromMeta.followers ?? fromDom.followers);
    const following = normalizeNumber(fromMeta.following ?? fromDom.following);
    const posts = normalizeNumber(fromMeta.posts ?? fromDom.posts);
    const handle = (fromMeta.handle ?? fromDom.handle ?? '').replace(/^@/, '');
    const bio = (fromDom.bio || '').trim();

    return { followers, following, posts, handle, bio };
  }

  // History API hooks to detect SPA navigation
  (function () {
    try {
      const _push = history.pushState;
      history.pushState = function () {
        _push.apply(this, arguments);
        window.dispatchEvent(new Event('banshi_navigation'));
      };
      const _replace = history.replaceState;
      history.replaceState = function () {
        _replace.apply(this, arguments);
        window.dispatchEvent(new Event('banshi_navigation'));
      };
      window.addEventListener('popstate', () => window.dispatchEvent(new Event('banshi_navigation')));
    } catch (e) {
      // ignore
    }
  })();

  function waitForProfileData(timeout = 5000, interval = 300) {
    return new Promise((resolve) => {
      let elapsed = 0;
      const check = () => {
        const d = collectProfile();
        if ((d.handle && d.handle.length > 0) || (typeof d.followers === 'number' && d.followers > 0)) return resolve(d);
        elapsed += interval;
        if (elapsed >= timeout) return resolve(d);
        setTimeout(check, interval);
      };
      check();
    });
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'COLLECT_PROFILE') return;
    (async () => {
      try {
        const initial = collectProfile();
        if ((initial.handle && initial.handle.length > 0) || (typeof initial.followers === 'number' && initial.followers > 0)) {
          sendResponse(initial);
          return;
        }
        const waited = await waitForProfileData(5000, 300);
        sendResponse(waited);
      } catch (e) {
        sendResponse(null);
      }
    })();
    return true; // keep channel open for async
  });

})();
