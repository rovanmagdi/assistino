/**
 * CSS-only entry. Exists so the library build emits dist/style.css alongside
 * the JS; nothing imports it at runtime. Consumers pull the stylesheet in
 * directly instead:
 *
 *     import "@assistino/react-agent-chat/style.css";
 */
import "./styles/lib.css";
