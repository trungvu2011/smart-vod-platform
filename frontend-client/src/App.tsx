/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Search } from "./pages/Search";
import { Watch } from "./pages/Watch";
import { Channel } from "./pages/Channel";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { CreatorStudio } from "./pages/CreatorStudio";
import { CreatorStudioUpload } from "./pages/CreatorStudioUpload";
import { AccountSettings } from "./pages/AccountSettings";
import { History } from "./pages/History";
import { NotFound } from "./pages/NotFound";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="search" element={<Search />} />
          <Route path="watch/:id" element={<Watch />} />
          <Route path="channel/:id" element={<Channel />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="studio" element={<CreatorStudio />} />
          <Route path="studio/upload" element={<CreatorStudioUpload />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Router>
  );
}
